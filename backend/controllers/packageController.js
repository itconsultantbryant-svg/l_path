const { ParticipationPackage, UserPackage, User, Wallet, Transaction } = require('../models');
const { Op } = require('sequelize');
const { updateWalletBalance } = require('../utils/wallet');
const { logAction } = require('../utils/audit');
const db = require('../models');

/**
 * Get all available packages
 */
const getAllPackages = async (req, res, next) => {
  try {
    const packages = await ParticipationPackage.findAll({
      where: {
        isActive: true,
        isDisabled: false
      },
      order: [['sortOrder', 'ASC'], ['price', 'ASC']]
    });

    res.json({
      success: true,
      data: { packages }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single package
 */
const getPackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const packageData = await ParticipationPackage.findByPk(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.'
      });
    }

    res.json({
      success: true,
      data: { package: packageData }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase package
 */
const purchasePackage = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get package
    const packageData = await ParticipationPackage.findByPk(id, { transaction });

    if (!packageData) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Package not found.'
      });
    }

    if (!packageData.isActive || packageData.isDisabled) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This package is not available for purchase.'
      });
    }

    // Get user wallet
    const wallet = await Wallet.findOne({
      where: { userId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!wallet) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }

    // Check balance
    if (parseFloat(wallet.balance) < parseFloat(packageData.price)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to purchase this package.'
      });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + packageData.durationDays);

    // Create user package
    const userPackage = await UserPackage.create({
      userId,
      packageId: packageData.id,
      purchaseAmount: packageData.price,
      startDate,
      endDate,
      status: 'active',
      totalRewardsEarned: 0.00,
      totalTasksCompleted: 0
    }, { transaction });

    // Deduct amount from wallet
    await updateWalletBalance(
      wallet.id,
      packageData.price,
      'debit',
      `Package purchase: ${packageData.name}`,
      userId,
      { packageId: packageData.id, userPackageId: userPackage.id },
      { transaction }
    );

    await transaction.commit();

    await logAction(userId, 'PACKAGE_PURCHASE', 'UserPackage', userPackage.id, `Purchased package: ${packageData.name}`, req);

    res.status(201).json({
      success: true,
      message: 'Package purchased successfully.',
      data: { userPackage }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get user's packages
 */
const getMyPackages = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const packages = await UserPackage.findAll({
      where,
      include: [{
        model: ParticipationPackage,
        as: 'package'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { packages }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPackages,
  getPackage,
  purchasePackage,
  getMyPackages
};

