import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItemsForUser, PANEL_TITLES, getRoleName } from '../../utils/staffConfig';
import logo from '../../assets/liberty_path_logo.png';

const AdminLayout = () => {
  const { logout, user, getRoleLabel } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = getMenuItemsForUser(user);
  const roleName = getRoleName(user);
  const panelTitle = PANEL_TITLES[roleName] || 'Staff Panel';

  const isActive = (path) => `${location.pathname}${location.search}` === path;

  const renderMenuLink = (item) => (
    <Link
      key={`${item.path}-${item.title}`}
      to={item.path}
      onClick={closeSidebarOnMobile}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
        isActive(item.path)
          ? 'bg-yellow-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      } ${sidebarOpen ? '' : 'justify-center'}`}
      title={item.title}
    >
      <span className="text-xl">{item.icon}</span>
      {sidebarOpen && <span className="flex-1">{item.title}</span>}
      {sidebarOpen && item.badge && (
        <span className="px-2 py-0.5 text-xs bg-red-600 rounded-full">!</span>
      )}
    </Link>
  );

  const sections = [
    { key: 'main', label: 'Main' },
    { key: 'financial', label: 'Financial' },
    { key: 'products', label: 'Products' },
    { key: 'support', label: 'Support' },
    { key: 'system', label: 'System' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
      } lg:translate-x-0 lg:w-64`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
            {sidebarOpen && (
              <div className="flex items-center">
                <img src={logo} alt="LibertyPath logo" className="h-9 w-auto mr-2" />
                <div>
                  <h1 className="text-xl font-bold text-yellow-400">LibertyPath</h1>
                  <p className="text-xs text-gray-400">{panelTitle}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded hover:bg-gray-800 hidden lg:block"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-800">
            {sidebarOpen ? (
              <div>
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || user?.phone}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-600 rounded">
                  {getRoleLabel()}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-yellow-600 rounded-full flex items-center justify-center">
                  {user?.firstName?.[0] || 'A'}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {sections.map((section, index) => {
              const sectionItems = menuItems.filter((item) => item.section === section.key);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.key} className={index > 0 ? 'pt-4' : ''}>
                  {sidebarOpen && (
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">{section.label}</p>
                  )}
                  {sectionItems.map(renderMenuLink)}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800"
            >
              <span className="text-xl">👤</span>
              {sidebarOpen && <span>User View</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 w-full mt-2"
            >
              <span className="text-xl">🚪</span>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md bg-gray-100 text-gray-700"
        >
          ☰
        </button>
        <div className="flex items-center space-x-2">
          <img src={logo} alt="LibertyPath logo" className="h-7 w-auto" />
          <div className="font-semibold text-gray-900">{panelTitle}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="transition-all duration-300 lg:ml-64">
        <div className="px-4 py-4 lg:px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
