const { User, Referral, ReferralEarning, Wallet } = require('../models');
const { Op } = require('sequelize');
const { buildReferralTree, getReferralRates, getMarch15PromoStatus } = require('../utils/referral');

/**
 * Get my referrals
 */
const getMyReferrals = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Wallet,
        as: 'wallet'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get referral stats
    const totalReferrals = await User.count({
      where: { referredBy: req.user.id }
    });

    const totalEarnings = await ReferralEarning.sum('commissionAmount', {
      where: { userId: req.user.id }
    }) || 0;

    const todayEarnings = await ReferralEarning.sum('commissionAmount', {
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }) || 0;

    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `${req.protocol}://${req.get('host')}`;
    const referralLink = `${baseUrl.replace(/\/$/, '')}/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalReferrals,
          totalEarnings: parseFloat(totalEarnings),
          todayEarnings: parseFloat(todayEarnings)
        },
        march15Promo: getMarch15PromoStatus()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral tree
 */
const getReferralTree = async (req, res, next) => {
  try {
    const { maxLevel = 5 } = req.query;

    const tree = await buildReferralTree(req.user.id, parseInt(maxLevel));

    res.json({
      success: true,
      data: { tree }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral earnings
 */
const getReferralEarnings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, level } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (level) {
      where.level = parseInt(level);
    }

    const { count, rows } = await ReferralEarning.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'referredUser',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        earnings: rows,
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

module.exports = {
  getMyReferrals,
  getReferralTree,
  getReferralEarnings
};

