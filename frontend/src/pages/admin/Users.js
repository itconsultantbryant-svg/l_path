import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const AdminUsers = () => {
  const { userId } = useParams();
  const [users, setUsers] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalUserId, setPinModalUserId] = useState(null);
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' });
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = {
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        kycStatus: kycFilter !== 'all' ? kycFilter : undefined,
        search: searchTerm || undefined
      };
      const res = await axios.get('/admin/users', { params });
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || {});
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, kycFilter, searchTerm]);

  const fetchUserDetail = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`/admin/users/${id}`);
      setUserDetail(res.data.data);
    } catch (error) {
      toast.error('Error fetching user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchUserDetail(userId);
    } else {
      fetchUsers();
    }
  }, [userId, page, statusFilter, kycFilter, fetchUserDetail, fetchUsers]);

  const suspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;

    try {
      await axios.put(`/admin/users/${userId}/suspend`);
      toast.success('User suspended');
      if (userId === userDetail?.user?.id) {
        fetchUserDetail(userId);
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const activateUser = async (userId) => {
    try {
      await axios.put(`/admin/users/${userId}/activate`);
      toast.success('User activated');
      if (userId === userDetail?.user?.id) {
        fetchUserDetail(userId);
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const updateKYC = async (userId, status) => {
    try {
      await axios.put(`/admin/users/${userId}/kyc`, { kycStatus: status });
      toast.success(`KYC status updated to ${status}`);
      if (userId === userDetail?.user?.id) {
        fetchUserDetail(userId);
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update KYC status');
    }
  };

  const resetUserPassword = async (userId) => {
    const newPassword = window.prompt('Enter a new password (min 8 characters):');
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (!window.confirm('Reset this user password? This will replace their current password.')) {
      return;
    }
    try {
      await axios.put(`/admin/users/${userId}/password`, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const openSetPinModal = (userId) => {
    setPinModalUserId(userId);
    setPinForm({ newPin: '', confirmPin: '' });
    setShowPinModal(true);
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinModalUserId(null);
    setPinForm({ newPin: '', confirmPin: '' });
  };

  const setUserWithdrawalPin = async (e) => {
    e.preventDefault();
    if (!pinModalUserId) return;
    if (pinForm.newPin.length < 4 || pinForm.newPin.length > 8) {
      toast.error('PIN must be between 4 and 8 digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error('PIN and confirmation do not match.');
      return;
    }
    setPinSubmitting(true);
    try {
      await axios.put(`/admin/users/${pinModalUserId}/withdrawal-pin`, {
        pin: pinForm.newPin,
        confirmPin: pinForm.confirmPin
      });
      toast.success("User's withdrawal PIN has been set. They can use this PIN for withdrawals.");
      closePinModal();
      if (userId === pinModalUserId && userDetail) {
        fetchUserDetail(pinModalUserId);
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set withdrawal PIN");
    } finally {
      setPinSubmitting(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`/admin/users/${userToDelete.id}`);
      toast.success('User deleted');
      setShowDeleteModal(false);
      setUserToDelete(null);
      if (userToDelete.id === userDetail?.user?.id) {
        navigate('/admin/users');
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) => (
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    ));
  };

  const runBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    if (!window.confirm(`Apply "${bulkAction}" to ${selectedUsers.length} users?`)) return;
    try {
      await axios.put('/admin/users/bulk', {
        action: bulkAction,
        userIds: selectedUsers
      });
      toast.success('Bulk action applied');
      setSelectedUsers([]);
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk action failed');
    }
  };

  if (loading && !users.length && !userDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // User Detail View
  if (userId && userDetail) {
    const { user, stats, recent, referralTeam, packages = [], taskCompletions = [] } = userDetail;
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="text-yellow-600 hover:text-yellow-700 mb-4 flex items-center"
          >
            ← Back to Users
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{user.email || user.phone}</p>
            </div>
            <div className="flex gap-2">
              {user.isSuspended ? (
                <button
                  onClick={() => activateUser(user.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Activate User
                </button>
              ) : (
                <button
                  onClick={() => suspendUser(user.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Suspend User
                </button>
              )}
              <button
                onClick={() => resetUserPassword(user.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reset Password
              </button>
              <button
                onClick={() => openSetPinModal(user.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Reset Withdrawal PIN
              </button>
              <button
                onClick={() => {
                  setUserToDelete(user);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{user.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium">{user.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Referral Code</label>
                  <p className="font-medium">{user.referralCode}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Role</label>
                  <p className="font-medium capitalize">{user.role?.name || 'user'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">KYC Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.kycStatus}
                    </span>
                    {user.kycStatus !== 'approved' && (
                      <button
                        onClick={() => updateKYC(user.id, 'approved')}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Approve KYC
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Account Status</label>
                  <p className={`font-medium ${
                    user.isSuspended ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Joined Date</label>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Last Login</label>
                  <p className="font-medium">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Wallet Balance</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {parseFloat(user.wallet?.balance || 0).toFixed(2)} {user.wallet?.currency || 'LRD'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Deposited</label>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approvedDeposits.toFixed(2)} LRD
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Withdrawn</label>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.totalWithdrawals.toFixed(2)} LRD
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Earned</label>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(user.wallet?.totalEarned || 0).toFixed(2)} LRD
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Activity Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Deposits</label>
                  <p className="text-xl font-bold">{stats.depositCount}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Withdrawals</label>
                  <p className="text-xl font-bold">{stats.withdrawalCount}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tasks Completed</label>
                  <p className="text-xl font-bold">{stats.taskCompletions}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Referrals</label>
                  <p className="text-xl font-bold">{stats.referralCount}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Rewards</label>
                  <p className="text-xl font-bold">{stats.totalRewards.toFixed(2)} LRD</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Referral Earnings</label>
                  <p className="text-xl font-bold">{stats.totalReferralEarnings.toFixed(2)} LRD</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Active Packages</label>
                  <p className="text-xl font-bold">{stats.activePackages}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Packages</label>
                  <p className="text-xl font-bold">{stats.totalPackages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/admin/deposits?userId=${user.id}`)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  View Deposits
                </button>
                <button
                  onClick={() => navigate(`/admin/withdrawals?userId=${user.id}`)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  View Withdrawals
                </button>
                <button
                  onClick={() => resetUserPassword(user.id)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => openSetPinModal(user.id)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  Reset Withdrawal PIN
                </button>
                <button
                  onClick={() => updateKYC(user.id, user.kycStatus === 'approved' ? 'pending' : 'approved')}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  {user.kycStatus === 'approved' ? 'Reset KYC' : 'Approve KYC'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recent Deposits</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent?.deposits?.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-2">{parseFloat(deposit.amount).toFixed(2)} {deposit.currency}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        deposit.status === 'approved' ? 'bg-green-100 text-green-800' :
                        deposit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(deposit.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packages (Detailed) */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Packages ({packages.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Package</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Purchased</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expires</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remaining</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Daily Reward</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tasks/Day</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.length > 0 ? packages.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{p.package?.name || 'Package'}</div>
                      <div className="text-xs text-gray-500">
                        Amount: {parseFloat(p.purchaseAmount || 0).toFixed(2)} LRD
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'active' ? 'bg-green-100 text-green-800' :
                        p.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        p.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {p.purchaseDate ? new Date(p.purchaseDate).toLocaleString() : (p.createdAt ? new Date(p.createdAt).toLocaleString() : '-')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {p.computedEndDate ? new Date(p.computedEndDate).toLocaleString() : (p.endDate ? new Date(p.endDate).toLocaleString() : '-')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {p.remainingDays === null || p.remainingDays === undefined ? '-' : `${p.remainingDays} day(s)`}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {parseFloat(p.package?.dailyRewardAmount || 0).toFixed(2)} LRD
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {parseInt(p.package?.tasksPerDay || 1, 10)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="text-xs text-gray-500">Tasks: {parseInt(p.totalTasksCompleted || 0, 10)}</div>
                      <div className="text-xs text-gray-500">Rewards: {parseFloat(p.totalRewardsEarned || 0).toFixed(2)} LRD</div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No packages found for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Completions (Detailed) */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Task Completions ({taskCompletions.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Completed At</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Task</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Package</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reward</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Completion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taskCompletions.length > 0 ? taskCompletions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {c.completedAt ? new Date(c.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">{c.task?.title || 'Task'}</div>
                      <div className="text-xs text-gray-500">{c.task?.taskType || ''}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {c.userPackage?.package?.name || c.userPackage?.packageId || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {parseFloat(c.rewardAmount || 0).toFixed(2)} LRD
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {c.completionDate || '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No task completions found for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral Team */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Referral Team ({stats.referralCount})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">KYC</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referralTeam?.map((refUser) => (
                  <tr key={refUser.id}>
                    <td className="px-4 py-2">{refUser.firstName} {refUser.lastName}</td>
                    <td className="px-4 py-2">{refUser.email || refUser.phone}</td>
                    <td className="px-4 py-2">{parseFloat(refUser.wallet?.balance || 0).toFixed(2)} LRD</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        refUser.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        refUser.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {refUser.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(refUser.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => navigate(`/admin/users/${refUser.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Set Withdrawal PIN Modal (detail view) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Set User Withdrawal PIN</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Enter a new PIN (4-8 digits). The user will use this PIN for withdrawals until they change it in Profile.
            </p>
            <form onSubmit={setUserWithdrawalPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New PIN (4-8 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm((f) => ({ ...f, newPin: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter new PIN"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm((f) => ({ ...f, confirmPin: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Confirm new PIN"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closePinModal}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pinSubmitting ? 'Setting...' : 'Set PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
  }

  // Users List View
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.referralCode?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">View, edit, and manage all platform users</p>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-sm text-gray-600">
          Selected: <span className="font-semibold">{selectedUsers.length}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Choose bulk action</option>
            <option value="activate">Activate Users</option>
            <option value="suspend">Suspend Users</option>
            <option value="delete">Delete Users</option>
          </select>
          <button
            onClick={runBulkAction}
            disabled={!bulkAction || selectedUsers.length === 0}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, phone, name, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value === 'all') {
                    next.delete('status');
                  } else {
                    next.set('status', e.target.value);
                  }
                  return next;
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All KYC</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email || user.phone}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Ref: {user.referralCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">
                      {parseFloat(user.wallet?.balance || 0).toFixed(2)} {user.wallet?.currency || 'LRD'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Earned: {parseFloat(user.wallet?.totalEarned || 0).toFixed(2)} LRD
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      parseInt(user.approvedDepositCount || 0, 10) > 0 && parseInt(user.packageCount || 0, 10) > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {parseInt(user.approvedDepositCount || 0, 10) > 0 && parseInt(user.packageCount || 0, 10) > 0
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {user.isSuspended ? (
                      <button
                        onClick={() => activateUser(user.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => resetUserPassword(user.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => openSetPinModal(user.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Set Withdrawal PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Set User Withdrawal PIN</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Enter a new PIN (4-8 digits). The user will use this PIN for withdrawals until they change it in Profile.
            </p>
            <form onSubmit={setUserWithdrawalPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New PIN (4-8 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm((f) => ({ ...f, newPin: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter new PIN"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm((f) => ({ ...f, confirmPin: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Confirm new PIN"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closePinModal}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pinSubmitting ? 'Setting...' : 'Set PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
