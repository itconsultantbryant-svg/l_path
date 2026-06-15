const { User, Referral, SystemSetting } = require('../models');
const { Op } = require('sequelize');

// Helper functions for date (since we might not have date-fns installed yet)
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get referral commission rates by level
 */
const getReferralRates = async () => {
  try {
    // Try to get rates from system settings
    const settings = await SystemSetting.findAll({
      where: {
        key: {
          [Op.like]: 'referral_rate_level_%'
        },
        category: 'referral'
      }
    });

    if (settings && settings.length > 0) {
      const rates = {};
      settings.forEach(setting => {
        const level = setting.key.replace('referral_rate_level_', '');
        rates[level] = parseFloat(setting.value) || 0;
      });
      return rates;
    }

    // Default rates (activity-based, not deposit-based)
    return {
      1: 5.0,  // 5% for level 1
      2: 3.0,  // 3% for level 2
      3: 2.0,  // 2% for level 3
      4: 1.0,  // 1% for level 4
      5: 0.5   // 0.5% for level 5
    };
  } catch (error) {
    console.error('Error getting referral rates:', error);
    // Return default rates on error
    return {
      1: 5.0,
      2: 3.0,
      3: 2.0,
      4: 1.0,
      5: 0.5
    };
  }
};

/**
 * Get maximum referral commission per transaction
 */
const getMaxReferralCommission = async () => {
  try {
    const setting = await SystemSetting.findOne({
      where: {
        key: 'referral_max_commission_per_transaction',
        category: 'referral'
      }
    });

    if (!setting) return null;
    const value = parseFloat(setting.value);
    return Number.isNaN(value) ? null : value;
  } catch (error) {
    return null;
  }
};

/**
 * Get maximum referral commission per day
 */
const getMaxReferralCommissionPerDay = async () => {
  try {
    const setting = await SystemSetting.findOne({
      where: {
        key: 'referral_max_commission_per_day',
        category: 'referral'
      }
    });

    if (!setting) return null;
    const value = parseFloat(setting.value);
    return Number.isNaN(value) ? null : value;
  } catch (error) {
    return null;
  }
};

/**
 * Build referral tree for a user
 */
const buildReferralTree = async (userId, maxLevel = 5) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const tree = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode
      },
      referrer: null,
      referrals: []
    };

    // Get referrer
    if (user.referredBy) {
      const referrer = await User.findByPk(user.referredBy, {
        attributes: ['id', 'email', 'firstName', 'lastName', 'referralCode']
      });
      if (referrer) {
        tree.referrer = {
          id: referrer.id,
          email: referrer.email,
          firstName: referrer.firstName,
          lastName: referrer.lastName,
          referralCode: referrer.referralCode
        };
      }
    }

    // Get direct referrals (level 1)
    const directReferrals = await User.findAll({
      where: { referredBy: userId },
      attributes: ['id', 'email', 'firstName', 'lastName', 'referralCode', 'createdAt']
    });

    for (const referral of directReferrals) {
      const referralData = {
        user: {
          id: referral.id,
          email: referral.email,
          firstName: referral.firstName,
          lastName: referral.lastName,
          referralCode: referral.referralCode,
          joinedAt: referral.createdAt
        },
        level: 1,
        referrals: []
      };

      // Recursively get sub-referrals if maxLevel > 1
      if (maxLevel > 1) {
        referralData.referrals = await buildReferralTree(referral.id, maxLevel - 1);
      }

      tree.referrals.push(referralData);
    }

    return tree;
  } catch (error) {
    console.error('Error building referral tree:', error);
    throw error;
  }
};

/**
 * Get referral chain for commission calculation (up to 5 levels)
 */
const getReferralChain = async (userId, maxLevel = 5) => {
  const chain = [];
  let currentUserId = userId;

  for (let level = 1; level <= maxLevel; level++) {
    const user = await User.findByPk(currentUserId);
    if (!user || !user.referredBy) {
      break;
    }

    const referrer = await User.findByPk(user.referredBy, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'isSuspended']
    });

    if (!referrer || !referrer.isActive || referrer.isSuspended) {
      break;
    }

    chain.push({
      userId: referrer.id,
      level,
      user: referrer
    });

    currentUserId = referrer.id;
  }

  return chain;
};

/**
 * Check if referral commission should be capped for today
 */
const checkDailyCommissionCap = async (userId) => {
  try {
    const { ReferralEarning } = require('../models');
    const { Op } = require('sequelize');

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const todayEarnings = await ReferralEarning.sum('commissionAmount', {
      where: {
        userId,
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      }
    });

    const maxCommission = await getMaxReferralCommissionPerDay();
    const totalEarnings = parseFloat(todayEarnings || 0);
    if (!maxCommission || maxCommission <= 0) {
      return {
        totalToday: totalEarnings,
        maxAllowed: null,
        remaining: Infinity,
        isCapped: false
      };
    }

    return {
      totalToday: totalEarnings,
      maxAllowed: maxCommission,
      remaining: Math.max(0, maxCommission - totalEarnings),
      isCapped: totalEarnings >= maxCommission
    };
  } catch (error) {
    console.error('Error checking daily commission cap:', error);
    return {
      totalToday: 0,
      maxAllowed: null,
      remaining: Infinity,
      isCapped: false
    };
  }
};

/** March 15 Holiday Promo: 10% instant referral on referred user's first deposit.
 *  Applies only when an existing user refers a NEW user during the promo period (registration
 *  between promo start and end). Users referred before the promo do not qualify for this bonus.
 */
const MARCH15_PROMO_START = new Date('2026-03-04T00:00:00.000Z');
const MARCH15_PROMO_END = new Date('2026-03-15T23:59:59.999Z');

/**
 * Returns true if the March 15 holiday referral deposit bonus is currently active.
 * After this period, referral rewards continue as normal (task-based only for new activity).
 */
const isMarch15HolidayPromoActive = () => {
  const now = new Date();
  return now >= MARCH15_PROMO_START && now <= MARCH15_PROMO_END;
};

/**
 * Get March 15 promo status for frontend (active, endsAt).
 */
const getMarch15PromoStatus = () => ({
  active: isMarch15HolidayPromoActive(),
  startsAt: MARCH15_PROMO_START.toISOString(),
  endsAt: MARCH15_PROMO_END.toISOString()
});

/**
 * Returns true if the referred user was registered during the March 15 promo window.
 * The 10% deposit bonus applies only when an existing user refers a NEW user during the promo
 * (i.e. the referred user's registration date is between promo start and end).
 */
const wasReferredDuringMarch15Promo = (referredUserRegisteredAt) => {
  if (!referredUserRegisteredAt) return false;
  const d = new Date(referredUserRegisteredAt);
  if (Number.isNaN(d.getTime())) return false;
  return d >= MARCH15_PROMO_START && d <= MARCH15_PROMO_END;
};

module.exports = {
  getReferralRates,
  getMaxReferralCommission,
  getMaxReferralCommissionPerDay,
  buildReferralTree,
  getReferralChain,
  checkDailyCommissionCap,
  isMarch15HolidayPromoActive,
  getMarch15PromoStatus,
  wasReferredDuringMarch15Promo
};

