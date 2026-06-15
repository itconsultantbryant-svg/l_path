const { DailyTask, TaskCompletion, UserPackage, User, Wallet, ReferralEarning, ParticipationPackage } = require('../models');
const { Op } = require('sequelize');
const { updateWalletBalance } = require('../utils/wallet');
const { getReferralChain, getReferralRates } = require('../utils/referral');
const { logAction } = require('../utils/audit');
const db = require('../models');

const getDateOnlyString = (date) => {
  const normalized = new Date(date);
  const year = normalized.getFullYear();
  const month = `${normalized.getMonth() + 1}`.padStart(2, '0');
  const day = `${normalized.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getActivePackagesForDate = async (userId, date, transaction) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const rows = await UserPackage.findAll({
    where: {
      userId,
      status: 'active',
      startDate: { [Op.lte]: dayEnd }
    },
    include: [{
      model: ParticipationPackage,
      as: 'package'
    }],
    order: [['createdAt', 'DESC']],
    transaction
  });

  // Use computed end date (startDate + current package duration) so admin duration updates
  // take effect for existing purchases.
  return rows.filter((userPackage) => {
    const durationDays = parseInt(userPackage?.package?.durationDays || 0, 10);
    if (!durationDays) return false;
    const start = new Date(userPackage.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const computedEnd = new Date(start);
    computedEnd.setDate(computedEnd.getDate() + durationDays);
    computedEnd.setHours(23, 59, 59, 999);
    return computedEnd >= dayStart;
  });
};

const resolveEligiblePackages = async (userId, date, transaction) => {
  return getActivePackagesForDate(userId, date, transaction);
};

/**
 * Get daily tasks
 */
const getDailyTasks = async (req, res, next) => {
  try {
    const todayString = getDateOnlyString(new Date());
    const where = {
      isActive: true,
      isDisabled: false,
      [Op.or]: [
        { scheduledDate: null }, // Daily tasks
        { scheduledDate: { [Op.lte]: todayString } } // Tasks started on/before today
      ]
    };

    let activeUserPackages = [];
    if (req.user) {
      activeUserPackages = await resolveEligiblePackages(req.user.id, new Date());

      if (activeUserPackages.length === 0) {
        return res.json({
          success: true,
          data: {
            tasks: [],
            completedTaskIds: [],
            hasActivePackages: false
          }
        });
      }

      const activePackageIds = activeUserPackages.map(userPackage => userPackage.packageId);
      where[Op.and] = [
        {
          [Op.or]: [
            { packageId: { [Op.in]: activePackageIds } },
            { packageId: null }
          ]
        }
      ];
    } else {
      // Public view only shows tasks without package scope
      where.packageId = null;
    }

    // Check if user has completed tasks today
    let completedTaskIds = [];
    if (req.user) {
      const completions = await TaskCompletion.findAll({
        where: {
          userId: req.user.id,
          completionDate: todayString
        },
        attributes: ['taskId', 'packageId']
      });
      completedTaskIds = completions.map(c => `${c.taskId}:${c.packageId || 'none'}`);
    }

    const tasks = await DailyTask.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    // Mark completed tasks (one entry per active user package)
    const defaultUserPackage = activeUserPackages[0] || null;
    const tasksWithCompletion = [];

    tasks.forEach(task => {
      const taskData = task.toJSON();
      if (taskData.packageId) {
        const matchingPackages = activeUserPackages.filter(
          userPackage => userPackage.packageId === taskData.packageId
        );
        matchingPackages.forEach(userPackage => {
          const packageKey = userPackage.id;
          const effectiveRewardAmount = userPackage.package?.dailyRewardAmount > 0
            ? parseFloat(userPackage.package.dailyRewardAmount)
            : parseFloat(taskData.rewardAmount);
          tasksWithCompletion.push({
            ...taskData,
            packageName: userPackage.package?.name || null,
            userPackageId: userPackage.id,
            packageDailyRewardAmount: userPackage.package?.dailyRewardAmount || 0,
            effectiveRewardAmount,
            isCompleted: completedTaskIds.includes(`${taskData.id}:${packageKey}`)
          });
        });
      } else {
        const packageKey = defaultUserPackage?.id || 'none';
        const effectiveRewardAmount = defaultUserPackage?.package?.dailyRewardAmount > 0
          ? parseFloat(defaultUserPackage.package.dailyRewardAmount)
          : parseFloat(taskData.rewardAmount);
        tasksWithCompletion.push({
          ...taskData,
          packageName: defaultUserPackage?.package?.name || null,
          userPackageId: defaultUserPackage?.id || null,
          packageDailyRewardAmount: defaultUserPackage?.package?.dailyRewardAmount || 0,
          effectiveRewardAmount,
          isCompleted: completedTaskIds.includes(`${taskData.id}:${packageKey}`)
        });
      }
    });

    res.json({
      success: true,
      data: {
        tasks: tasksWithCompletion,
        completedTaskIds,
        hasActivePackages: req.user ? activeUserPackages.length > 0 : false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task
 */
const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await DailyTask.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    // Check if user completed this task today
    let isCompleted = false;
    if (req.user) {
      const today = getDateOnlyString(new Date());
      const completion = await TaskCompletion.findOne({
        where: {
          userId: req.user.id,
          taskId: id,
          completionDate: today
        }
      });
      isCompleted = !!completion;
    }

    res.json({
      success: true,
      data: {
        task,
        isCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete task
 */
const completeTask = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;
    const today = getDateOnlyString(new Date());

    // Get task
    const task = await DailyTask.findByPk(id, { transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (!task.isActive || task.isDisabled) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This task is not available.'
      });
    }

    // Check if task is available yet
    const taskDate = task.scheduledDate ? getDateOnlyString(task.scheduledDate) : null;
    if (taskDate && taskDate > today) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This task is not available yet.'
      });
    }

    // Get user's active packages
    let activePackages = await resolveEligiblePackages(userId, new Date(), transaction);

    if (activePackages.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You need an active participation package to complete tasks.'
      });
    }

    const { userPackageId } = req.body || {};
    let userPackage = null;

    if (userPackageId) {
      userPackage = activePackages.find(pkg => pkg.id === userPackageId) || null;
      if (!userPackage) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Selected package is not active or not found.'
        });
      }
    }

    if (task.packageId) {
      const matchingPackages = activePackages.filter(pkg => pkg.packageId === task.packageId);
      if (matchingPackages.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'You do not have an active package for this task.'
        });
      }
      if (!userPackage) {
        userPackage = matchingPackages[0];
      } else if (userPackage.packageId !== task.packageId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Selected package does not match this task.'
        });
      }
    }

    if (!userPackage) {
      userPackage = activePackages[0];
    }

    // Check if user already completed this task today for this package
    const existingCompletion = await TaskCompletion.findOne({
      where: {
        userId,
        taskId: id,
        completionDate: today,
        packageId: userPackage.id
      },
      transaction
    });

    if (existingCompletion) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already completed this task today for this package.'
      });
    }

    // Enforce package daily task limit
    const tasksCompletedToday = await TaskCompletion.count({
      where: {
        userId,
        packageId: userPackage.id,
        completionDate: today
      },
      transaction
    });

    if (!userPackage.package) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Package information not found.'
      });
    }

    if (tasksCompletedToday >= parseInt(userPackage.package.tasksPerDay || 1)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have reached today\'s task limit for this package.'
      });
    }

    // Check if package reward cap is reached
    if (userPackage.package && userPackage.package.maxRewardAmount) {
      if (parseFloat(userPackage.totalRewardsEarned) >= parseFloat(userPackage.package.maxRewardAmount)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'You have reached the maximum reward limit for this package.'
        });
      }
    }

    // Get reward amount from package or task
    let rewardAmount = parseFloat(task.rewardAmount);
    if (userPackage.package && userPackage.package.dailyRewardAmount > 0) {
      rewardAmount = parseFloat(userPackage.package.dailyRewardAmount);
    }

    if (Number.isNaN(rewardAmount) || rewardAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid reward amount configured for this task.'
      });
    }

    // Create task completion
    const completion = await TaskCompletion.create({
      userId,
      taskId: id,
      packageId: userPackage.id,
      rewardAmount,
      completionDate: today,
      completedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      isVerified: true
    }, { transaction });

    // Update user package
    userPackage.totalTasksCompleted += 1;
    userPackage.totalRewardsEarned = parseFloat((parseFloat(userPackage.totalRewardsEarned) + rewardAmount).toFixed(2));
    userPackage.lastRewardDate = new Date();
    await userPackage.save({ transaction });

    // Credit reward to wallet
    const wallet = await Wallet.findOne({ where: { userId }, transaction });
    if (!wallet) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Wallet not found. Please contact support.'
      });
    }

    await updateWalletBalance(
      wallet.id,
      rewardAmount,
      'reward',
      `Task completion: ${task.title}`,
      userId,
      { taskId: id, completionId: completion.id, packageId: userPackage.id },
      { transaction }
    );

    // Process referral commissions
    await processReferralCommissions(userId, rewardAmount, 'task_completion', completion.id, transaction);

    await transaction.commit();

    await logAction(userId, 'TASK_COMPLETION', 'TaskCompletion', completion.id, `Completed task: ${task.title}`, req);

    res.json({
      success: true,
      message: 'Task completed successfully!',
      data: {
        completion,
        rewardAmount
      }
    });
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'You have already completed this task today for this package.'
      });
    }
    next(error);
  }
};

/**
 * Process referral commissions
 */
const processReferralCommissions = async (userId, baseAmount, commissionType, referenceId, transaction) => {
  try {
    const referralChain = await getReferralChain(userId, 5);
    if (referralChain.length === 0) return;

    const rates = await getReferralRates();

    for (const referral of referralChain) {
      // Calculate commission
      const rate = rates[referral.level] || 0;
      let commissionAmount = parseFloat((baseAmount * (rate / 100)).toFixed(2));

      if (commissionAmount <= 0) continue;

      // Create referral earning
      await ReferralEarning.create({
        userId: referral.userId,
        referredUserId: userId,
        level: referral.level,
        commissionType,
        commissionAmount,
        baseAmount,
        commissionRate: rate,
        currency: 'LRD',
        referenceId,
        referenceType: 'TaskCompletion'
      }, { transaction });

      // Credit to referrer's wallet
      const wallet = await Wallet.findOne({
        where: { userId: referral.userId },
        transaction
      });

      if (wallet) {
        await updateWalletBalance(
          wallet.id,
          commissionAmount,
          'referral',
          `Referral commission (Level ${referral.level})`,
          referral.userId,
          {
            referredUserId: userId,
            level: referral.level,
            referenceId
          },
          { transaction }
        );
      }
    }
  } catch (error) {
    console.error('Error processing referral commissions:', error);
    // Don't throw - referral commission failure shouldn't break task completion
  }
};

/**
 * Get user's task completions
 */
const getMyCompletions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await TaskCompletion.findAndCountAll({
      where: { userId: req.user.id },
      include: [{
        model: DailyTask,
        as: 'task'
      }],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        completions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task history (completed and uncompleted)
 */
const getTaskHistory = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || '7', 10), 1), 30);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    endDate.setHours(0, 0, 0, 0);

    const history = [];

    for (let i = 0; i < days; i += 1) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const dateString = getDateOnlyString(date);

      let activeUserPackages = await resolveEligiblePackages(req.user.id, date);
      const activePackageIds = activeUserPackages.map(userPackage => userPackage.packageId);

      if (activeUserPackages.length === 0) {
        history.push({
          date: dateString,
          hasActivePackages: false,
          tasks: []
        });
        continue;
      }

      const tasks = await DailyTask.findAll({
        where: {
          isActive: true,
          isDisabled: false,
          [Op.or]: [
            { scheduledDate: null },
            { scheduledDate: { [Op.lte]: dateString } }
          ],
          [Op.and]: [
            {
              [Op.or]: [
                { packageId: { [Op.in]: activePackageIds } },
                { packageId: null }
              ]
            }
          ]
        },
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });

      const completions = await TaskCompletion.findAll({
        where: {
          userId: req.user.id,
          completionDate: dateString
        },
        attributes: ['taskId', 'packageId', 'completedAt', 'rewardAmount']
      });

      const completionMap = new Map(
        completions.map(completion => [
          `${completion.taskId}:${completion.packageId || 'none'}`,
          completion
        ])
      );

      const packageMap = new Map(
        activeUserPackages.map(userPackage => [userPackage.packageId, userPackage])
      );
      const defaultUserPackage = activeUserPackages[0] || null;

      const tasksWithStatus = tasks.map(task => {
        const taskData = task.toJSON();
        const scopedUserPackage = taskData.packageId
          ? packageMap.get(taskData.packageId)
          : defaultUserPackage;
        const packageKey = scopedUserPackage?.id || 'none';
        const completionKey = `${taskData.id}:${packageKey}`;
        const completion = completionMap.get(completionKey);
        const effectiveRewardAmount = scopedUserPackage?.package?.dailyRewardAmount > 0
          ? parseFloat(scopedUserPackage.package.dailyRewardAmount)
          : parseFloat(taskData.rewardAmount);

        return {
          ...taskData,
          packageName: scopedUserPackage?.package?.name || null,
          userPackageId: scopedUserPackage?.id || null,
          packageDailyRewardAmount: scopedUserPackage?.package?.dailyRewardAmount || 0,
          effectiveRewardAmount,
          isCompleted: Boolean(completion),
          completedAt: completion?.completedAt || null,
          rewardAmount: completion?.rewardAmount || null
        };
      });

      history.push({
        date: dateString,
        hasActivePackages: true,
        tasks: tasksWithStatus
      });
    }

    res.json({
      success: true,
      data: {
        history
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyTasks,
  getTask,
  completeTask,
  getMyCompletions,
  getTaskHistory
};

