import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchDeposits = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const res = await axios.get('/admin/deposits', { params });
      setDeposits(res.data.data.deposits || []);
    } catch (error) {
      toast.error('Error fetching deposits');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const approveDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to approve this deposit? This will credit the user\'s wallet.')) {
      return;
    }

    try {
      await axios.put(`/admin/deposits/${depositId}/approve`);
      toast.success('Deposit approved! Wallet credited.');
      fetchDeposits();
      // Refresh dashboard if we're coming from there
      if (window.location.search.includes('from=dashboard')) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve deposit');
    }
  };

  const rejectDeposit = async (depositId) => {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this deposit?')) {
      return;
    }

    try {
      await axios.put(`/admin/deposits/${depositId}/reject`, { reason });
      toast.success('Deposit rejected');
      fetchDeposits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject deposit');
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      deposit.user?.email?.toLowerCase().includes(search) ||
      deposit.user?.phone?.toLowerCase().includes(search) ||
      deposit.user?.firstName?.toLowerCase().includes(search) ||
      deposit.user?.lastName?.toLowerCase().includes(search) ||
      deposit.paymentReference?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    approved: deposits.filter(d => d.status === 'approved').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
    pendingAmount: deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit Management</h1>
        <p className="text-gray-600">Review and approve user deposit requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Deposits</div>
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
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-blue-700">
            {stats.totalAmount.toFixed(2)} LRD
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user email, phone, name, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-2">
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

      {/* Deposits Table */}
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
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
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
              {filteredDeposits.length > 0 ? (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deposit.user?.firstName} {deposit.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deposit.user?.email || deposit.user?.phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {deposit.user?.id?.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {parseFloat(deposit.amount).toFixed(2)} {deposit.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {deposit.paymentMethod?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {deposit.paymentReference || '-'}
                      </div>
                      {deposit.receiptUrl && (
                        <a
                          href={deposit.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-yellow-600 hover:text-yellow-700"
                        >
                          View Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(deposit.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deposit.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : deposit.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deposit.status}
                      </span>
                      {deposit.approvedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Approved: {new Date(deposit.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {deposit.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveDeposit(deposit.id)}
                            className="text-green-600 hover:text-green-900 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDeposit(deposit.id)}
                            className="text-red-600 hover:text-red-900 font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {deposit.status !== 'pending' && (
                        <span className="text-gray-400">No action needed</span>
                      )}
                      <button
                        onClick={() => navigate(`/admin/users/${deposit.userId}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View User Profile"
                      >
                        View User
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No deposits found
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

export default AdminDeposits;
