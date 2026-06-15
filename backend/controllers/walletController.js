const { Wallet, Transaction, Deposit, Withdrawal, SystemSetting, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getWalletBalance, updateWalletBalance, calculateServiceFee, calculateNetWithdrawal } = require('../utils/wallet');
const { logAction } = require('../utils/audit');
const config = require('../config/config');
const bcrypt = require('bcryptjs');

/**
 * Get wallet balance
 */
const getBalance = async (req, res, next) => {
  try {
    const wallet = await getWalletBalance(req.user.id);

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }

    const where = { userId: req.user.id };
    if (type) {
      where.type = type;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        transactions: rows,
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
 * Request deposit
 */
const requestDeposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentReference, receiptUrl } = req.body;

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }

    // Only one pending deposit at a time
    const existingPendingDeposit = await Deposit.findOne({
      where: {
        userId: req.user.id,
        status: 'pending'
      }
    });
    if (existingPendingDeposit) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending deposit request. Please wait for approval before submitting another deposit.'
      });
    }

    const deposit = await Deposit.create({
      userId: req.user.id,
      walletId: wallet.id,
      amount: parseFloat(amount),
      currency: wallet.currency,
      paymentMethod,
      paymentReference: paymentReference || null,
      receiptUrl: receiptUrl || null,
      status: 'pending'
    });

    await logAction(req.user.id, 'DEPOSIT_REQUEST', 'Deposit', deposit.id, `Deposit request: ${amount} ${wallet.currency}`, req);

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted. Awaiting approval.',
      data: { deposit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get deposit history
 */
const getDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Deposit.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        deposits: rows,
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
 * Get deposit options (mobile money numbers and USSD templates)
 */
const getDepositOptions = async (req, res, next) => {
  try {
    const defaultMtnNumber = '0881031901';
    const defaultOrangeNumber = '0775592486';

    const [mtnSetting] = await SystemSetting.findOrCreate({
      where: { key: 'payment_mtn_momo_number' },
      defaults: {
        value: defaultMtnNumber,
        valueType: 'string',
        category: 'payments',
        description: 'MTN Mobile Money deposit number',
        isPublic: true
      }
    });

    const [orangeSetting] = await SystemSetting.findOrCreate({
      where: { key: 'payment_orange_money_number' },
      defaults: {
        value: defaultOrangeNumber,
        valueType: 'string',
        category: 'payments',
        description: 'Orange Money deposit number',
        isPublic: true
      }
    });

    const mtnNumber = mtnSetting.value || defaultMtnNumber;
    const orangeNumber = orangeSetting.value || defaultOrangeNumber;

    res.json({
      success: true,
      data: {
        mtn: {
          number: mtnNumber,
          ussdTemplate: `*156*1*1*${mtnNumber}*2*{amount}#`
        },
        orange: {
          number: orangeNumber,
          ussdTemplate: `*144*2*1*1*${orangeNumber}*{amount}#`
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const nextMondaySameTime = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  result.setDate(result.getDate() + daysUntilMonday);
  return result;
};

const calculateExpectedProcessingAt = (requestedAt) => {
  const base = new Date(requestedAt);
  let expected = new Date(base.getTime() + 24 * 60 * 60 * 1000);

  if (isWeekend(base)) {
    expected = nextMondaySameTime(base);
  } else if (isWeekend(expected)) {
    expected = nextMondaySameTime(expected);
  }

  return expected;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // JS: 0=Sun ... 6=Sat. Convert to Monday-based index.
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // if Sunday, go back 6 days
  d.setDate(d.getDate() + diff);
  return d;
};

const endOfWeekSunday = (date) => {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Request withdrawal
 */
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, paymentMethod, accountNumber, accountName, bankName, withdrawalPin } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!user.withdrawalPinHash) {
      return res.status(400).json({
        success: false,
        message: 'Please set a withdrawal PIN before requesting a withdrawal.'
      });
    }

    if (!withdrawalPin) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal PIN is required.'
      });
    }

    const pinValid = await bcrypt.compare(withdrawalPin, user.withdrawalPinHash);
    if (!pinValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal PIN.'
      });
    }

    // Validate minimum withdrawal amount
    if (parseFloat(amount) < config.business.minWithdrawalAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${config.business.minWithdrawalAmount} ${config.business.currency}.`
      });
    }

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }

    // Check balance
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance.'
      });
    }

    // Calculate service fee and net amount
    const serviceFee = calculateServiceFee(parseFloat(amount));
    const netAmount = calculateNetWithdrawal(parseFloat(amount));
    const totalRequired = parseFloat(amount); // User needs to have full amount (fee is deducted)

    // Check if balance is sufficient for withdrawal + fee
    if (parseFloat(wallet.balance) < totalRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal and service fee.'
      });
    }

    // Only one pending withdrawal at a time
    const existingPendingWithdrawal = await Withdrawal.findOne({
      where: {
        userId: req.user.id,
        status: 'pending'
      }
    });
    if (existingPendingWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request. Please wait for approval before submitting another withdrawal.'
      });
    }

    // Enforce: only one withdrawal request per week (Mon-Sun) per user.
    // Approval can happen anytime; this restriction is only on requesting/creating withdrawals.
    const now = new Date();
    const weekStart = startOfWeekMonday(now);
    const weekEnd = endOfWeekSunday(now);
    const weeklyWithdrawalCount = await Withdrawal.count({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    });

    if (weeklyWithdrawalCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only request one withdrawal per week. Please try again next week.'
      });
    }

    // Enforce weekly maximum total amount
    const weeklyTotal = await Withdrawal.sum('amount', {
      where: {
        userId: req.user.id,
        createdAt: { [Op.between]: [weekStart, weekEnd] }
      }
    });
    const currentWeeklyTotal = parseFloat(weeklyTotal || 0);
    const requestedAmount = parseFloat(amount);
    if ((currentWeeklyTotal + requestedAmount) > config.business.maxWithdrawalPerWeek) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal per week is ${config.business.maxWithdrawalPerWeek} ${config.business.currency}.`
      });
    }

    const expectedProcessingAt = calculateExpectedProcessingAt(new Date());

    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      walletId: wallet.id,
      amount: parseFloat(amount),
      serviceFee,
      netAmount,
      currency: wallet.currency,
      paymentMethod,
      accountNumber: accountNumber || null,
      accountName: accountName || null,
      bankName: bankName || null,
      status: 'pending',
      metadata: {
        expectedProcessingAt: expectedProcessingAt.toISOString()
      }
    });

    await logAction(req.user.id, 'WITHDRAWAL_REQUEST', 'Withdrawal', withdrawal.id, `Withdrawal request: ${amount} ${wallet.currency} (Fee: ${serviceFee} ${wallet.currency})`, req);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Awaiting approval.',
      data: {
        withdrawal,
        note: `Service fee of ${serviceFee} ${wallet.currency} (${config.business.serviceFeePercentage}%) will be deducted.`,
        expectedProcessingAt: expectedProcessingAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawal history
 */
const getWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Withdrawal.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        withdrawals: rows,
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
  getBalance,
  getTransactions,
  requestDeposit,
  getDeposits,
  getDepositOptions,
  requestWithdrawal,
  getWithdrawals
};

