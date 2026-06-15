import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = ({ dashboardTitle = 'Admin Dashboard' }) => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchDashboard();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchDashboard(true); // Silent refresh
        }
      }, 15000); // Refresh every 15 seconds
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboard(true);
      }
    };
    const handleFocus = () => fetchDashboard(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboard = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await axios.get('/admin/dashboard');
      setStats(res.data.data);
      setLastUpdated(new Date());
      if (!silent) setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (!silent) {
        toast.error('Error loading dashboard');
        setLoading(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchDashboard();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const financials = stats?.stats?.financials || {};
  const recentDeposits = stats?.recent?.deposits || [];
  const recentWithdrawals = stats?.recent?.withdrawals || [];
  const revenue = parseFloat(financials.totalDeposits || 0);
  const expenditure = parseFloat(financials.totalWithdrawals || 0) + parseFloat(financials.rewardLiability || 0) + parseFloat(financials.totalReferralEarnings || 0);
  const profit = revenue - expenditure;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

  const showFinancial = hasPermission('deposits') || hasPermission('withdrawals') || hasPermission('reports');
  const showUsers = hasPermission('users');
  const showProducts = hasPermission('packages') || hasPermission('tasks');
  const showReferrals = hasPermission('referrals') || hasPermission('reports');
  const showDeposits = hasPermission('deposits');
  const showWithdrawals = hasPermission('withdrawals');

  const quickActions = [
    { to: '/admin/deposits?status=pending', icon: '💰', label: 'Approve Deposits', permission: 'depositsWrite' },
    { to: '/admin/withdrawals?status=pending', icon: '💸', label: 'Approve Withdrawals', permission: 'withdrawalsWrite' },
    { to: '/admin/users', icon: '👥', label: 'Manage Users', permission: 'users' },
    { to: '/admin/chat', icon: '💬', label: 'Support Chat', permission: 'chat' },
    { to: '/admin/packages', icon: '📦', label: 'Manage Packages', permission: 'packages' },
    { to: '/admin/settings', icon: '⚙️', label: 'System Settings', permission: 'settings' }
  ].filter((action) => hasPermission(action.permission));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dashboardTitle}</h1>
          <p className="text-gray-600 mt-1">
            Real-time overview for your position
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-500">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {autoRefresh ? 'Live' : 'Paused'}
          </span>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh (15s)</span>
          </label>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {showFinancial && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <span className="text-3xl">💰</span>
            </div>
            <span className="text-sm opacity-90">Revenue</span>
          </div>
          <div className="text-3xl font-bold mb-1">{revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LRD</div>
          <div className="text-sm opacity-75">Total Deposits Approved</div>
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="text-xs opacity-75">Service Fees Collected</div>
            <div className="text-lg font-semibold">{parseFloat(financials.platformRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD</div>
          </div>
        </div>

        {/* Expenditure Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <span className="text-3xl">💸</span>
            </div>
            <span className="text-sm opacity-90">Expenditure</span>
          </div>
          <div className="text-3xl font-bold mb-1">{expenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LRD</div>
          <div className="text-sm opacity-75">Withdrawals + Rewards</div>
          <div className="mt-4 pt-4 border-t border-white border-opacity-20 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-75">Withdrawals:</span>
              <span className="font-semibold">{parseFloat(financials.totalWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-75">Rewards:</span>
              <span className="font-semibold">{parseFloat(financials.rewardLiability || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD</span>
            </div>
          </div>
        </div>

        {/* Profit/Loss Card */}
        <div className={`rounded-xl shadow-lg p-6 text-white ${
          profit >= 0 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <span className="text-3xl">{profit >= 0 ? '📈' : '📉'}</span>
            </div>
            <span className="text-sm opacity-90">{profit >= 0 ? 'Profit' : 'Loss'}</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {profit >= 0 ? '+' : ''}{profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LRD
          </div>
          <div className="text-sm opacity-75">Net Position</div>
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="text-xs opacity-75">Profit Margin</div>
            <div className="text-lg font-semibold">{profitMargin}%</div>
          </div>
        </div>

        {/* Pending Actions Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <span className="text-3xl">⏳</span>
            </div>
            <span className="text-sm opacity-90">Pending</span>
          </div>
          <div className="text-3xl font-bold mb-1">{parseFloat(financials.pendingWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD</div>
          <div className="text-sm opacity-75">Withdrawals Awaiting</div>
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <Link 
              to="/admin/withdrawals?status=pending"
              className="text-sm underline opacity-90 hover:opacity-100"
            >
              Review Requests →
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* User Statistics */}
      {(showUsers || showProducts || showReferrals) && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {showUsers && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">👥</span>
            <span className="text-xs text-gray-500">Total Users</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.stats?.totalUsers || 0}</div>
          <div className="mt-2 text-sm text-gray-600">
            {stats?.stats?.activeUsers || 0} active • {stats?.stats?.inactiveUsers || 0} inactive
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.stats?.suspendedUsers || 0} suspended
          </div>
        </div>
        )}

        {showProducts && (
        <>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">💎</span>
            <span className="text-xs text-gray-500">Packages Purchased</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.stats?.totalPackagePurchases || 0}</div>
          <div className="mt-2 text-sm text-gray-600">
            {stats?.stats?.packagePurchasesToday || 0} today • {stats?.stats?.totalPackages || 0} active
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">✅</span>
            <span className="text-xs text-gray-500">Tasks Completed</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.stats?.totalTaskCompletions || 0}</div>
          <div className="mt-2 text-sm text-gray-600">
            Today • {stats?.stats?.totalTaskCompletionsAll || 0} total
          </div>
        </div>
        </>
        )}

        {showReferrals && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">🔗</span>
            <span className="text-xs text-gray-500">Referral Earnings</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {parseFloat(financials.totalReferralEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD
          </div>
          <div className="mt-2 text-sm text-gray-600">Total paid out</div>
        </div>
        )}
      </div>
      )}

      {/* Recent Activities */}
      {(showDeposits || showWithdrawals) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showDeposits && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Deposits</h2>
            <Link 
              to="/admin/deposits"
              className="text-sm text-yellow-600 hover:text-yellow-700"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDeposits.length > 0 ? (
              recentDeposits.slice(0, 5).map((deposit) => (
                <div key={deposit.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {deposit.user?.firstName} {deposit.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{deposit.user?.email || deposit.user?.phone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">
                        {parseFloat(deposit.amount).toFixed(2)} {deposit.currency}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                        deposit.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : deposit.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deposit.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent deposits
              </div>
            )}
          </div>
        </div>
        )}

        {showWithdrawals && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Withdrawals</h2>
            <Link 
              to="/admin/withdrawals"
              className="text-sm text-yellow-600 hover:text-yellow-700"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentWithdrawals.length > 0 ? (
              recentWithdrawals.slice(0, 5).map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{withdrawal.user?.email || withdrawal.user?.phone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(withdrawal.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">
                        {parseFloat(withdrawal.amount).toFixed(2)} {withdrawal.currency}
                      </div>
                      <div className="text-xs text-red-600">
                        Fee: {parseFloat(withdrawal.serviceFee || 0).toFixed(2)} {withdrawal.currency}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                        withdrawal.status === 'approved' || withdrawal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent withdrawals
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="font-medium">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default AdminDashboard;
