const { ChatMessage, User } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../utils/audit');

/**
 * Get chat messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, before } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isDeleted: false,
      messageType: { [Op.in]: ['user', 'admin_broadcast', 'system'] }
    };

    if (before) {
      where.createdAt = { [Op.lt]: new Date(before) };
    }

    const { count, rows } = await ChatMessage.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Reverse to show oldest first
    const messages = rows.reverse();

    res.json({
      success: true,
      data: {
        messages,
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
 * Send message
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Check if user is suspended or inactive
    if (req.user.isSuspended || !req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to send messages.'
      });
    }

    const chatMessage = await ChatMessage.create({
      userId: req.user.id,
      message: message.trim(),
      messageType: 'user',
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      isPinned: false
    });

    await logAction(req.user.id, 'CHAT_MESSAGE', 'ChatMessage', chatMessage.id, 'Sent chat message', req);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: await ChatMessage.findByPk(chatMessage.id, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }]
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report message
 */
const reportMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chatMessage = await ChatMessage.findByPk(id);

    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.'
      });
    }

    if (chatMessage.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own message.'
      });
    }

    // Increment report count
    chatMessage.isReported = true;
    chatMessage.reportCount += 1;
    await chatMessage.save();

    await logAction(req.user.id, 'CHAT_REPORT', 'ChatMessage', chatMessage.id, 'Reported chat message', req);

    res.json({
      success: true,
      message: 'Message reported. Our moderators will review it.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  reportMessage
};

