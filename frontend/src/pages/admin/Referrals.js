import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [referralConfig, setReferralConfig] = useState({
    level1: 5,
    level2: 3,
    level3: 2,
    level4: 1,
    level5: 0.5,
    maxCommissionPerTransaction: 1000,
    maxDailyCommission: 5000
  });

  useEffect(() => {
    fetchReferrals();
    fetchStats();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await axios.get('/admin/referrals');
      setReferrals(res.data.data.referrals || []);
    } catch (error) {
      toast.error('Error fetching referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/admin/referrals');
      if (res.data.data.stats) {
        setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const updateReferralConfig = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/admin/referrals/config', referralConfig);
      toast.success('Referral configuration updated successfully');
      setShowConfigModal(false);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update referral configuration');
    }
  };

  const runBackfill = async () => {
    if (!window.confirm('Backfill referral commissions for all users?')) return;
    setBackfillLoading(true);
    try {
      const res = await axios.post('/admin/referrals/backfill');
      const { createdReferrals = 0, createdEarnings = 0 } = res.data.data || {};
      toast.success(`Backfill complete: ${createdReferrals} referrals, ${createdEarnings} commissions`);
      fetchReferrals();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to backfill referrals');
    } finally {
      setBackfillLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Management</h1>
          <p className="text-gray-600">Manage referral system, rates, and earnings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={runBackfill}
            disabled={backfillLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-60"
          >
            <span>🔁</span>
            <span>{backfillLoading ? 'Backfilling...' : 'Backfill Commissions'}</span>
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
          >
            <span>⚙️</span>
            <span>Configure Rates</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">🔗</span>
            <span className="text-xs text-gray-500">Total Referrals</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.totalReferrals || referrals.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">💰</span>
            <span className="text-xs text-gray-500">Total Earnings</span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {parseFloat(stats?.totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">📊</span>
            <span className="text-xs text-gray-500">Level 1 Rate</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {referralConfig.level1}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">📈</span>
            <span className="text-xs text-gray-500">Max Daily Commission</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {parseFloat(referralConfig.maxDailyCommission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LRD
          </div>
        </div>
      </div>

      {/* Referral Tree Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Referral Structure</h2>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">Level {level}</div>
              <div className="text-2xl font-bold text-yellow-600">
                {referralConfig[`level${level}`]}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Commission Rate</div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">All Referrals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.length > 0 ? (
                referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">
                          {referral.referrer?.firstName} {referral.referrer?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{referral.referrer?.email || referral.referrer?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">
                          {referral.referred?.firstName} {referral.referred?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{referral.referred?.email || referral.referred?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        Level {referral.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        referral.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {referral.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/admin/users/${referral.referrerId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Referrer
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No referrals found yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Referral Configuration</h2>
            <form onSubmit={updateReferralConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level {level} Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={referralConfig[`level${level}`]}
                      onChange={(e) => setReferralConfig({
                        ...referralConfig,
                        [`level${level}`]: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Commission Per Transaction (LRD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={referralConfig.maxCommissionPerTransaction}
                    onChange={(e) => setReferralConfig({
                      ...referralConfig,
                      maxCommissionPerTransaction: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Daily Commission (LRD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={referralConfig.maxDailyCommission}
                    onChange={(e) => setReferralConfig({
                      ...referralConfig,
                      maxDailyCommission: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Commission rates are activity-based (not deposit-based) to comply with regulations.
                  Referrers earn commissions when their referrals complete tasks, not when they deposit.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Update Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;

