const { SystemSetting, Deposit } = require('../models');
const { resolveWhatsAppUrl, parseBooleanSetting } = require('../utils/whatsapp');

const WHATSAPP_KEYS = {
  SUPPORT_CONTACT: 'whatsapp_support_contact',
  SUPPORT_ENABLED: 'whatsapp_support_enabled',
  NEW_USERS_CONTACT: 'whatsapp_new_users_contact',
  NEW_USERS_ENABLED: 'whatsapp_new_users_enabled',
  OFFICIAL_CONTACT: 'whatsapp_official_contact',
  OFFICIAL_ENABLED: 'whatsapp_official_enabled'
};

const buildLinkConfig = (contact, enabled, envFallback = '') => {
  const raw = contact || envFallback || '';
  const url = resolveWhatsAppUrl(raw);
  return {
    contact: raw || null,
    url,
    enabled: parseBooleanSetting(enabled, true) && Boolean(url)
  };
};

const getAllWhatsAppConfig = async () => {
  const settings = await SystemSetting.findAll({
    where: { key: Object.values(WHATSAPP_KEYS) },
    attributes: ['key', 'value']
  });

  const byKey = settings.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const support = buildLinkConfig(
    byKey[WHATSAPP_KEYS.SUPPORT_CONTACT],
    byKey[WHATSAPP_KEYS.SUPPORT_ENABLED],
    process.env.WHATSAPP_SUPPORT_CONTACT || ''
  );

  const newUsers = buildLinkConfig(
    byKey[WHATSAPP_KEYS.NEW_USERS_CONTACT],
    byKey[WHATSAPP_KEYS.NEW_USERS_ENABLED],
    process.env.WHATSAPP_NEW_USERS_CONTACT || process.env.REACT_APP_WHATSAPP_GROUP_URL || ''
  );

  const official = buildLinkConfig(
    byKey[WHATSAPP_KEYS.OFFICIAL_CONTACT],
    byKey[WHATSAPP_KEYS.OFFICIAL_ENABLED],
    process.env.WHATSAPP_OFFICIAL_CONTACT || ''
  );

  return { support, newUsers, official };
};

const resolveDashboardWhatsApp = ({ newUsers, official }, hasApprovedDeposit, isActiveUser) => {
  if (isActiveUser && official.enabled && official.url) {
    return {
      type: 'official',
      url: official.url,
      label: 'Join Official WhatsApp Group',
      description: 'You are an active member. Join the official group for updates, support, and community chat.'
    };
  }

  if (!hasApprovedDeposit && newUsers.enabled && newUsers.url) {
    return {
      type: 'new',
      url: newUsers.url,
      label: 'Join WhatsApp Chatroom',
      description: 'Welcome! Join our chatroom to get started, ask questions, and stay connected while you set up your account.'
    };
  }

  return null;
};

const getWhatsAppSupport = async (req, res, next) => {
  try {
    const { support } = await getAllWhatsAppConfig();
    res.json({
      success: true,
      data: {
        contact: support.contact,
        url: support.url,
        enabled: support.enabled
      }
    });
  } catch (error) {
    next(error);
  }
};

const getWhatsAppForUser = async (req, res, next) => {
  try {
    const config = await getAllWhatsAppConfig();
    const approvedDepositCount = await Deposit.count({
      where: { userId: req.user.id, status: 'approved' }
    });

    const hasApprovedDeposit = approvedDepositCount > 0;
    const isActiveUser = Boolean(req.user.isActive && !req.user.isSuspended && hasApprovedDeposit);
    const dashboard = resolveDashboardWhatsApp(config, hasApprovedDeposit, isActiveUser);

    res.json({
      success: true,
      data: {
        support: config.support,
        newUsers: config.newUsers,
        official: config.official,
        hasApprovedDeposit,
        isActiveUser,
        dashboard
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findAll({
      where: { isPublic: true },
      attributes: ['key', 'value', 'valueType', 'category'],
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    const whatsapp = await getAllWhatsAppConfig();

    res.json({
      success: true,
      data: {
        settings,
        whatsapp
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWhatsAppSupport,
  getWhatsAppForUser,
  getPublicSettings,
  WHATSAPP_KEYS,
  getAllWhatsAppConfig,
  resolveDashboardWhatsApp
};
