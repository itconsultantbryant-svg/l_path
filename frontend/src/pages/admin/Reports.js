import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await axios.get('/admin/reports/overview');
      setReport(res.data.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const users = report?.users || {};
  const packages = report?.packages || {};
  const tasks = report?.tasks || {};
  const deposits = report?.deposits || {};
  const withdrawals = report?.withdrawals || {};
  const referrals = report?.referrals || {};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive system overview of inflows, outflows, and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{users.total || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {users.active || 0} active • {users.inactive || 0} inactive
          </div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Deposits</div>
          <div className="text-2xl font-bold text-blue-700">{parseFloat(deposits.totalAmount || 0).toFixed(2)} LRD</div>
          <div className="text-xs text-gray-500 mt-1">{deposits.totalCount || 0} requests</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Withdrawals</div>
          <div className="text-2xl font-bold text-red-700">{parseFloat(withdrawals.totalAmount || 0).toFixed(2)} LRD</div>
          <div className="text-xs text-gray-500 mt-1">{withdrawals.totalCount || 0} requests</div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Net Inflow</div>
          <div className="text-2xl font-bold text-green-700">
            {(parseFloat(deposits.totalAmount || 0) - parseFloat(withdrawals.totalAmount || 0)).toFixed(2)} LRD
          </div>
          <div className="text-xs text-gray-500 mt-1">Deposits minus withdrawals</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Users & Requests</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div>Active Users: <span className="font-semibold">{users.active || 0}</span></div>
            <div>Inactive Users: <span className="font-semibold">{users.inactive || 0}</span></div>
            <div>Suspended Users: <span className="font-semibold">{users.suspended || 0}</span></div>
            <div>Pending KYC: <span className="font-semibold">{users.pendingKyc || 0}</span></div>
            <div>Pending Deposits: <span className="font-semibold">{deposits.pendingCount || 0}</span></div>
            <div>Pending Withdrawals: <span className="font-semibold">{withdrawals.pendingCount || 0}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Packages & Tasks</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div>Total Packages: <span className="font-semibold">{packages.total || 0}</span></div>
            <div>Packages Purchased: <span className="font-semibold">{packages.purchases || 0}</span></div>
            <div>Active Packages: <span className="font-semibold">{packages.activePurchases || 0}</span></div>
            <div>Total Tasks: <span className="font-semibold">{tasks.total || 0}</span></div>
            <div>Tasks Completed: <span className="font-semibold">{tasks.completions || 0}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Deposits & Withdrawals</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div>Total Deposits: <span className="font-semibold">{parseFloat(deposits.totalAmount || 0).toFixed(2)} LRD</span></div>
            <div>Total Withdrawals: <span className="font-semibold">{parseFloat(withdrawals.totalAmount || 0).toFixed(2)} LRD</span></div>
            <div>Rejected Withdrawals: <span className="font-semibold">{withdrawals.rejectedCount || 0}</span></div>
            <div>Pending Deposits: <span className="font-semibold">{deposits.pendingCount || 0}</span></div>
            <div>Pending Withdrawals: <span className="font-semibold">{withdrawals.pendingCount || 0}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Referrals</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div>Total Referrals: <span className="font-semibold">{referrals.total || 0}</span></div>
            <div>Total Referral Earnings: <span className="font-semibold">{parseFloat(referrals.totalEarnings || 0).toFixed(2)} LRD</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
