export const STAFF_ROLES = ['admin', 'super_admin', 'hop', 'hom', 'finance', 'csm'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hop: 'Head of Operation (HOP)',
  hom: 'Head of Marketing (HOM)',
  finance: 'Finance Officer',
  csm: 'Customer Service Manager (CSM)'
};

export const ROLE_HOME_PATH = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  hop: '/admin/hop/dashboard',
  hom: '/admin/hom/dashboard',
  finance: '/admin/finance/dashboard',
  csm: '/admin/csm/dashboard'
};

export const PANEL_TITLES = {
  super_admin: 'Admin Panel',
  admin: 'Admin Panel',
  hop: 'Operations Panel',
  hom: 'Marketing Panel',
  finance: 'Finance Panel',
  csm: 'Customer Service Panel'
};

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

export const getRoleName = (user) => {
  if (!user) return null;
  if (typeof user.role === 'string') return user.role;
  return user.role?.name || null;
};

export const getEffectivePermissions = (user) => {
  const roleName = getRoleName(user);
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleName] || {};
  const stored = user?.role?.permissions && typeof user.role.permissions === 'object'
    ? user.role.permissions
    : {};
  return { ...defaults, ...stored };
};

export const hasPermission = (user, permission) => {
  const perms = getEffectivePermissions(user);
  if (perms.all) return true;
  return Boolean(perms[permission]);
};

export const isStaffUser = (user) => STAFF_ROLES.includes(getRoleName(user));

export const getStaffHomePath = (user) => {
  const roleName = getRoleName(user);
  return ROLE_HOME_PATH[roleName] || '/dashboard';
};

export const MENU_ITEMS = [
  { title: 'Dashboard', icon: '📊', path: 'dashboard', permission: 'dashboard', section: 'main', dynamicPath: true },
  { title: 'Staff Positions', icon: '👔', path: '/admin/staff', permission: 'staff', section: 'main' },
  { title: 'All Users', icon: '👥', path: '/admin/users', permission: 'users', section: 'main' },
  { title: 'Active Users', icon: '🟢', path: '/admin/users?status=active', permission: 'users', section: 'main' },
  { title: 'Inactive Users', icon: '⚪', path: '/admin/users?status=inactive', permission: 'users', section: 'main' },
  { title: 'Suspended Users', icon: '⛔', path: '/admin/users?status=suspended', permission: 'users', section: 'main' },
  { title: 'Reports', icon: '📈', path: '/admin/reports', permission: 'reports', section: 'main' },
  { title: 'Promotion', icon: '🔥', path: '/admin/promotion', permission: 'promotion', section: 'main' },
  { title: 'Reset Withdrawal PIN', icon: '🔐', path: '/admin/users', permission: 'usersWrite', section: 'main' },
  { title: 'Deposits', icon: '💰', path: '/admin/deposits', permission: 'deposits', badge: 'pending', section: 'financial' },
  { title: 'Withdrawals', icon: '💸', path: '/admin/withdrawals', permission: 'withdrawals', badge: 'pending', section: 'financial' },
  { title: 'Packages', icon: '📦', path: '/admin/packages', permission: 'packages', section: 'products' },
  { title: 'Tasks', icon: '✅', path: '/admin/tasks', permission: 'tasks', section: 'products' },
  { title: 'Referrals', icon: '🔗', path: '/admin/referrals', permission: 'referrals', section: 'products' },
  { title: 'Chat', icon: '💬', path: '/admin/chat', permission: 'chat', section: 'support' },
  { title: 'Settings', icon: '⚙️', path: '/admin/settings', permission: 'settings', section: 'system' }
];

export const getMenuItemsForUser = (user) => {
  const roleName = getRoleName(user);
  const dashboardPath = ROLE_HOME_PATH[roleName] || '/admin/dashboard';

  return MENU_ITEMS.filter((item) => {
    if (item.permission === 'staff') {
      return roleName === 'admin' || roleName === 'super_admin';
    }
    return hasPermission(user, item.permission);
  }).map((item) => {
    if (item.dynamicPath) {
      return { ...item, path: dashboardPath };
    }
    return item;
  });
};

export const ROUTE_PERMISSIONS = {
  '/admin/dashboard': 'dashboard',
  '/admin/hop/dashboard': 'dashboard',
  '/admin/hom/dashboard': 'dashboard',
  '/admin/finance/dashboard': 'dashboard',
  '/admin/csm/dashboard': 'dashboard',
  '/admin/staff': 'staff',
  '/admin/users': 'users',
  '/admin/deposits': 'deposits',
  '/admin/withdrawals': 'withdrawals',
  '/admin/packages': 'packages',
  '/admin/tasks': 'tasks',
  '/admin/referrals': 'referrals',
  '/admin/promotion': 'promotion',
  '/admin/chat': 'chat',
  '/admin/reports': 'reports',
  '/admin/settings': 'settings'
};

export const getPermissionForPath = (pathname) => {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  if (pathname.startsWith('/admin/users')) return 'users';
  return null;
};
