const STAFF_ROLES = ['admin', 'super_admin', 'hop', 'hom', 'finance', 'csm'];

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hop: 'Head of Operation',
  hom: 'Head of Marketing',
  finance: 'Finance Officer',
  csm: 'Customer Service Manager'
};

/** Default permission sets per staff position (merged with role.permissions from DB). */
const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: { all: true },
  admin: { all: true },
  hop: {
    dashboard: true,
    users: true,
    usersWrite: true,
    usersBulk: true,
    deposits: true,
    depositsWrite: true,
    withdrawals: true,
    withdrawalsWrite: true,
    packages: true,
    packagesWrite: true,
    tasks: true,
    tasksWrite: true,
    reports: true
  },
  hom: {
    dashboard: true,
    packages: true,
    packagesWrite: true,
    tasks: true,
    tasksWrite: true,
    referrals: true,
    referralsWrite: true,
    promotion: true,
    reports: true,
    chat: true,
    chatWrite: true,
    chatBroadcast: true
  },
  finance: {
    dashboard: true,
    deposits: true,
    depositsWrite: true,
    withdrawals: true,
    withdrawalsWrite: true,
    reports: true,
    users: true
  },
  csm: {
    dashboard: true,
    users: true,
    usersWrite: true,
    chat: true,
    chatWrite: true
  }
};

const ASSIGNABLE_STAFF_ROLES = ['hop', 'hom', 'finance', 'csm'];

const getRoleName = (userOrRole) => {
  if (!userOrRole) return null;
  if (typeof userOrRole === 'string') return userOrRole;
  if (userOrRole.name) return userOrRole.name;
  if (userOrRole.role?.name) return userOrRole.role.name;
  return null;
};

const getEffectivePermissions = (roleRecord) => {
  const roleName = getRoleName(roleRecord);
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleName] || {};
  const stored = roleRecord?.permissions && typeof roleRecord.permissions === 'object'
    ? roleRecord.permissions
    : {};
  return { ...defaults, ...stored };
};

const hasPermission = (roleRecord, permission) => {
  const perms = getEffectivePermissions(roleRecord);
  if (perms.all) return true;
  return Boolean(perms[permission]);
};

const isStaffRole = (roleName) => STAFF_ROLES.includes(roleName);

const canManageStaff = (roleRecord) => {
  const roleName = getRoleName(roleRecord);
  return roleName === 'super_admin' || roleName === 'admin';
};

module.exports = {
  STAFF_ROLES,
  ROLE_LABELS,
  ASSIGNABLE_STAFF_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  getRoleName,
  getEffectivePermissions,
  hasPermission,
  isStaffRole,
  canManageStaff
};
