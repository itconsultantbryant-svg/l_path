const { User, Role, Wallet, Referral } = require('../models');
const { generateToken } = require('../utils/jwt');
const { initializeWallet } = require('../utils/wallet');
const { logAction } = require('../utils/audit');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendEmail, sendSms } = require('../utils/notifications');

const maskEmail = (email) => {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return null;
  const maskedName = name.length <= 2 ? `${name[0]}*` : `${name[0]}***${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
};

const formatAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  firstName: user.firstName,
  lastName: user.lastName,
  referralCode: user.referralCode,
  kycStatus: user.kycStatus,
  hasWithdrawalPin: !!(user.withdrawalPinHash && String(user.withdrawalPinHash).trim()),
  role: user.role
    ? {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions || {}
      }
    : null
});

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;

    // Ensure either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists.'
      });
    }

    // Handle referral code (optional)
    let referredBy = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await User.findOne({
        where: { referralCode: referralCode.toUpperCase().trim() }
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Get default role (user)
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        message: 'System configuration error. Please contact support.'
      });
    }

    // Create user
    const user = await User.create({
      email: email || null,
      phone: phone || null,
      password,
      firstName,
      lastName,
      referredBy,
      roleId: defaultRole.id,
      emailVerified: false,
      phoneVerified: false,
      kycStatus: 'pending'
    });

    // Initialize wallet
    await initializeWallet(user.id, 'LRD');

    // Create direct referral record
    if (referredBy) {
      const existingReferral = await Referral.findOne({
        where: { referredId: user.id }
      });
      if (!existingReferral) {
        await Referral.create({
          referrerId: referredBy,
          referredId: user.id,
          level: 1,
          isActive: true
        });
      }
    }

    // Log action
    await logAction(user.id, 'USER_REGISTER', 'User', user.id, 'New user registration', req);

    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your account.',
      data: {
        user: formatAuthUser(userWithRole),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Ensure either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required.'
      });
    }

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      },
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check if account is active
    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or suspended. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log action
    await logAction(user.id, 'USER_LOGIN', 'User', user.id, 'User logged in', req);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatAuthUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: Wallet,
          as: 'wallet'
        }
      ],
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const userJson = user.toJSON ? user.toJSON() : user.get ? user.get({ plain: true }) : user;
    const hasWithdrawalPin = !!(user.withdrawalPinHash && String(user.withdrawalPinHash).trim());
    res.json({
      success: true,
      data: {
        user: { ...userJson, hasWithdrawalPin }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    // Log action
    await logAction(req.user.id, 'USER_LOGOUT', 'User', req.user.id, 'User logged out', req);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Don't reveal if user exists for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // TODO: Send email with reset token
    // For now, we'll just log it (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset token:', resetToken);
    }

    await logAction(user.id, 'PASSWORD_RESET_REQUEST', 'User', user.id, 'Password reset requested', req);

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    await logAction(user.id, 'PASSWORD_RESET', 'User', user.id, 'Password reset successful', req);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search account by similarity
 */
const searchAccount = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 3 characters to search.'
      });
    }

    const search = query.trim();
    const searchOp = require('../models').sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { email: { [searchOp]: `%${search}%` } },
          { phone: { [searchOp]: `%${search}%` } },
          { firstName: { [searchOp]: `%${search}%` } },
          { lastName: { [searchOp]: `%${search}%` } }
        ]
      },
      limit: 5,
      attributes: ['id', 'email', 'phone', 'firstName', 'lastName']
    });

    const matches = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      emailMasked: maskEmail(user.email),
      phoneMasked: maskPhone(user.phone),
      hasEmail: Boolean(user.email),
      hasPhone: Boolean(user.phone)
    }));

    res.json({
      success: true,
      data: { matches }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send recovery OTP code
 */
const sendRecoveryOtp = async (req, res, next) => {
  try {
    const { userId, channel } = req.body;
    if (!userId || !channel || !['email', 'phone'].includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'User and channel are required.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user || (channel === 'email' && !user.email) || (channel === 'phone' && !user.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Unable to send recovery code.'
      });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.recoveryCodeHash = hashedCode;
    user.recoveryCodeExpires = expiresAt;
    user.recoveryCodeChannel = channel;
    await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log('Recovery code:', code);
    } else {
      const message = `Your LibertyPath recovery code is ${code}. It expires in 10 minutes.`;
      if (channel === 'email') {
        const result = await sendEmail({
          to: user.email,
          subject: 'LibertyPath Recovery Code',
          text: message
        });
        if (!result.ok) {
          return res.status(500).json({
            success: false,
            message: result.error || 'Failed to send recovery code.'
          });
        }
      } else if (channel === 'phone') {
        const result = await sendSms({
          to: user.phone,
          body: message
        });
        if (!result.ok) {
          return res.status(500).json({
            success: false,
            message: result.error || 'Failed to send recovery code.'
          });
        }
      }
    }

    await logAction(user.id, 'RECOVERY_CODE_SENT', 'User', user.id, `Recovery code sent via ${channel}`, req);

    res.json({
      success: true,
      message: `Recovery code sent via ${channel}.`,
      data: process.env.NODE_ENV === 'development' ? { code } : undefined
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using recovery OTP
 */
const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { userId, code, password } = req.body;
    if (!userId || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'User, code, and password are required.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.recoveryCodeHash || !user.recoveryCodeExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired recovery code.'
      });
    }

    if (user.recoveryCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Recovery code has expired.'
      });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.recoveryCodeHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recovery code.'
      });
    }

    user.password = password;
    user.recoveryCodeHash = null;
    user.recoveryCodeExpires = null;
    user.recoveryCodeChannel = null;
    await user.save();

    await logAction(user.id, 'PASSWORD_RESET', 'User', user.id, 'Password reset via recovery code', req);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
      data: {
        loginHint: user.email || user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  searchAccount,
  sendRecoveryOtp,
  resetPasswordWithOtp
};

