const { Wallet, Transaction, sequelize } = require('../models');
const config = require('../config/config');

/**
 * Calculate service fee for withdrawal
 */
const calculateServiceFee = (amount) => {
  const feePercentage = config.business.serviceFeePercentage;
  return parseFloat((amount * (feePercentage / 100)).toFixed(2));
};

/**
 * Calculate net withdrawal amount after service fee
 */
const calculateNetWithdrawal = (amount) => {
  const serviceFee = calculateServiceFee(amount);
  return parseFloat((amount - serviceFee).toFixed(2));
};

/**
 * Update wallet balance (with transaction log)
 */
const updateWalletBalance = async (
  walletId,
  amount,
  type,
  description = null,
  userId = null,
  metadata = {},
  options = {}
) => {
  const VALID_TRANSACTION_TYPES = ['deposit', 'withdrawal', 'reward', 'referral', 'fee', 'refund', 'debit'];
  if (!VALID_TRANSACTION_TYPES.includes(type)) {
    throw new Error(`Invalid transaction type: ${type}`);
  }

  const useExternalTransaction = Boolean(options.transaction);
  const transaction = options.transaction || await sequelize.transaction();
  const supportsRowLock = sequelize.getDialect() !== 'sqlite';

  try {
    // Lock wallet row for update
    const wallet = await Wallet.findByPk(walletId, {
      ...(supportsRowLock ? { lock: transaction.LOCK.UPDATE } : {}),
      transaction
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const normalizedAmount = Number.parseFloat(amount);
    if (Number.isNaN(normalizedAmount)) {
      throw new Error('Invalid amount');
    }

    const balanceBefore = Number.parseFloat(wallet.balance) || 0;
    let balanceAfter = balanceBefore;

    // Update balance based on type
    if (type === 'deposit' || type === 'reward' || type === 'referral' || type === 'refund') {
      balanceAfter = parseFloat((balanceBefore + normalizedAmount).toFixed(2));
      wallet.balance = balanceAfter;
      
      if (type === 'deposit') {
        const totalDeposited = Number.parseFloat(wallet.totalDeposited) || 0;
        wallet.totalDeposited = parseFloat((totalDeposited + normalizedAmount).toFixed(2));
      }
      
      if (type === 'reward' || type === 'referral') {
        const totalEarned = Number.parseFloat(wallet.totalEarned) || 0;
        wallet.totalEarned = parseFloat((totalEarned + normalizedAmount).toFixed(2));
      }
    } else if (type === 'debit' || type === 'withdrawal' || type === 'fee') {
      balanceAfter = parseFloat((balanceBefore - normalizedAmount).toFixed(2));
      
      if (balanceAfter < 0) {
        throw new Error('Insufficient balance');
      }
      
      wallet.balance = balanceAfter;
      
      if (type === 'withdrawal') {
        const totalWithdrawn = Number.parseFloat(wallet.totalWithdrawn) || 0;
        wallet.totalWithdrawn = parseFloat((totalWithdrawn + normalizedAmount).toFixed(2));
      }
    } else {
      throw new Error('Invalid transaction type');
    }

    await wallet.save({ transaction });

    // Create transaction record
    const transactionRecord = await Transaction.create({
      userId: userId || wallet.userId,
      walletId: wallet.id,
      type,
      amount: parseFloat(normalizedAmount.toFixed(2)),
      balanceBefore,
      balanceAfter,
      currency: wallet.currency,
      description: description || `${type} transaction`,
      status: 'completed',
      metadata
    }, { transaction });

    if (!useExternalTransaction) {
      await transaction.commit();
    }

    return {
      wallet,
      transaction: transactionRecord,
      balanceBefore,
      balanceAfter
    };
  } catch (error) {
    if (!useExternalTransaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Get wallet balance
 */
const getWalletBalance = async (userId) => {
  const wallet = await Wallet.findOne({
    where: { userId }
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return wallet;
};

/**
 * Initialize wallet for user
 */
const initializeWallet = async (userId, currency = 'LRD') => {
  const wallet = await Wallet.findOrCreate({
    where: { userId },
    defaults: {
      userId,
      balance: 0.00,
      currency,
      totalEarned: 0.00,
      totalWithdrawn: 0.00,
      totalDeposited: 0.00
    }
  });

  return wallet[0];
};

module.exports = {
  calculateServiceFee,
  calculateNetWithdrawal,
  updateWalletBalance,
  getWalletBalance,
  initializeWallet
};

