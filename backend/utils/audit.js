const { AuditLog } = require('../models');

/**
 * Log an action to audit log
 */
const logAction = async (userId, action, entityType = null, entityId = null, description = null, req = null) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      entityType,
      entityId,
      description,
      ipAddress: req ? req.ip : null,
      userAgent: req ? req.get('user-agent') : null,
      metadata: req ? {
        url: req.originalUrl,
        method: req.method
      } : {}
    });
  } catch (error) {
    console.error('Failed to log action to audit log:', error);
  }
};

/**
 * Log admin action
 */
const logAdminAction = async (adminId, actionType, targetEntityType, targetEntityId, description, previousValue = null, newValue = null, req = null) => {
  try {
    const { AdminAction } = require('../models');
    await AdminAction.create({
      adminId,
      actionType,
      targetEntityType,
      targetEntityId,
      description,
      previousValue,
      newValue,
      ipAddress: req ? req.ip : null,
      metadata: req ? {
        url: req.originalUrl,
        method: req.method
      } : {}
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

module.exports = {
  logAction,
  logAdminAction
};

