import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, completed
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchWithdrawals = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const res = await axios.get('/admin/withdrawals', { params });
      setWithdrawals(res.data.data.withdrawals || []);
    } catch (error) {
      toast.error('Error fetching withdrawals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const approveWithdrawal = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal? This will deduct from the user\'s wallet and update expenditure.')) {
      return;
    }

    try {
      await axios.put(`/admin/withdrawals/${withdrawalId}/approve`);
      toast.success('Withdrawal approved! Wallet debited and expenditure updated.');
      fetchWithdrawals();
      // Refresh dashboard if we're coming from there
      if (window.location.search.includes('from=dashboard')) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
    }
  };

  const rejectWithdrawal = async (withdrawalId) => {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this withdrawal?')) {
      return;
    }

    try {
      await axios.put(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
    }
  };

  const completeWithdrawal = async (withdrawalId) => {
    const reference = window.prompt('Transaction reference (optional):') || '';
    if (!window.confirm('Mark this withdrawal as completed?')) {
      return;
    }

    try {
      await axios.put(`/admin/withdrawals/${withdrawalId}/complete`, {
        transactionReference: reference.trim() || undefined
      });
      toast.success('Withdrawal marked as completed');
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete withdrawal');
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      withdrawal.user?.email?.toLowerCase().includes(search) ||
      withdrawal.user?.phone?.toLowerCase().includes(search) ||
      withdrawal.user?.firstName?.toLowerCase().includes(search) ||
      withdrawal.user?.lastName?.toLowerCase().includes(search) ||
      withdrawal.paymentMethod?.toLowerCase().includes(search) ||
      withdrawal.accountNumber?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0),
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0),
    totalServiceFees: withdrawals.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + parseFloat(w.serviceFee || 0), 0),
    totalExpenditure: withdrawals.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + parseFloat(w.netAmount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
        <p className="text-gray-600">Review and approve user withdrawal requests. Approvals update expenditure in real-time.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Withdrawals</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.pendingAmount.toFixed(2)} LRD
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Service Fees</div>
          <div className="text-2xl font-bold text-blue-700">
            {stats.totalServiceFees.toFixed(2)} LRD
          </div>
          <div className="text-xs text-gray-500 mt-1">Platform Revenue</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Expenditure</div>
          <div className="text-2xl font-bold text-red-700">
            {stats.totalExpenditure.toFixed(2)} LRD
          </div>
          <div className="text-xs text-gray-500 mt-1">Net Paid Out</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user email, phone, name, or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'approved' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'completed' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'rejected' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.user?.email || withdrawal.user?.phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {withdrawal.user?.id?.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {parseFloat(withdrawal.amount).toFixed(2)} {withdrawal.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">
                        -{parseFloat(withdrawal.serviceFee || 0).toFixed(2)} {withdrawal.currency}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(parseFloat(withdrawal.serviceFee || 0) / parseFloat(withdrawal.amount) * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {parseFloat(withdrawal.netAmount || 0).toFixed(2)} {withdrawal.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 capitalize">
                        {withdrawal.paymentMethod?.replace(/_/g, ' ')}
                      </div>
                      {withdrawal.accountNumber && (
                        <div className="text-xs text-gray-500 mt-1">
                          {withdrawal.accountNumber}
                        </div>
                      )}
                      {withdrawal.accountName && (
                        <div className="text-xs text-gray-500">
                          {withdrawal.accountName}
                        </div>
                      )}
                      {withdrawal.bankName && (
                        <div className="text-xs text-gray-500">
                          {withdrawal.bankName}
                        </div>
                      )}
                      {withdrawal.metadata?.expectedProcessingAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          Expected: {new Date(withdrawal.metadata.expectedProcessingAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.status === 'approved' || withdrawal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                      {withdrawal.approvedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Approved: {new Date(withdrawal.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                      {withdrawal.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">
                          Reason: {withdrawal.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveWithdrawal(withdrawal.id)}
                            className="text-green-600 hover:text-green-900 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectWithdrawal(withdrawal.id)}
                            className="text-red-600 hover:text-red-900 font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {['approved', 'processing'].includes(withdrawal.status) && (
                        <button
                          onClick={() => completeWithdrawal(withdrawal.id)}
                          className="text-blue-600 hover:text-blue-900 font-semibold"
                        >
                          Complete
                        </button>
                      )}
                      {!['pending', 'approved', 'processing'].includes(withdrawal.status) && (
                        <span className="text-gray-400">No action needed</span>
                      )}
                      <button
                        onClick={() => navigate(`/admin/users/${withdrawal.userId}`)}
                        className="text-blue-600 hover:text-blue-900 block mt-1"
                        title="View User Profile"
                      >
                        View User
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
