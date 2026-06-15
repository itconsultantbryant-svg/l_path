import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/liberty_path_logo.png';

const MainLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="LibertyPath logo" className="h-9 w-auto mr-2" />
                <span className="text-2xl font-bold text-primary-600">LibertyPath</span>
              </Link>
              
              {user && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/dashboard"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/wallet"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Wallet
                  </Link>
                  <Link
                    to="/dashboard/packages"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Packages
                  </Link>
                  <Link
                    to="/dashboard/tasks"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Tasks
                  </Link>
                  <Link
                    to="/dashboard/referrals"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Referrals
                  </Link>
                  <Link
                    to="/dashboard/chat"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Chat
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin/dashboard"
                      className="border-transparent text-yellow-600 hover:border-yellow-300 hover:text-yellow-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center">
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden mr-3 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? '✕' : '☰'}
                </button>
              )}
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/dashboard/profile"
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium hidden sm:block"
                  >
                    {user.firstName} {user.lastName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {user && mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 px-4 py-3 space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Wallet
            </Link>
            <Link
              to="/dashboard/packages"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Packages
            </Link>
            <Link
              to="/dashboard/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Tasks
            </Link>
            <Link
              to="/dashboard/referrals"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Referrals
            </Link>
            <Link
              to="/dashboard/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Chat
            </Link>
            <Link
              to="/dashboard/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium"
            >
              Profile
            </Link>
            {isAdmin() && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-yellow-700 font-semibold"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} LibertyPath Ltd. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">Terms</Link>
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">Privacy</Link>
              <Link to="/disclaimer" className="text-sm text-gray-500 hover:text-gray-700">Disclaimer</Link>
              <Link to="/about" className="text-sm text-gray-500 hover:text-gray-700">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

