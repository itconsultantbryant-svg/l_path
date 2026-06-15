import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Referrals = () => {
  const [referralData, setReferralData] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
    fetchEarnings();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await axios.get('/referrals/my');
      setReferralData(res.data.data);
    } catch (error) {
      toast.error('Error fetching referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await axios.get('/referrals/earnings');
      setEarnings(res.data.data.earnings || []);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData?.referralLink || '');
    toast.success('Referral link copied!');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Referrals</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Referrals</div>
          <div className="text-3xl font-bold text-primary-600">
            {referralData?.stats?.totalReferrals || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600">
            {parseFloat(referralData?.stats?.totalEarnings || 0).toFixed(2)} LRD
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Today's Earnings</div>
          <div className="text-3xl font-bold text-blue-600">
            {parseFloat(referralData?.stats?.todayEarnings || 0).toFixed(2)} LRD
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={referralData?.referralLink || ''}
            readOnly
            className="flex-1 border rounded px-3 py-2 bg-gray-50"
          />
          <button
            onClick={copyReferralLink}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Share this link with friends to earn referral commissions when they complete tasks!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Referral Earnings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {earnings.slice(0, 20).map((earning) => (
                <tr key={earning.id}>
                  <td className="px-4 py-3 text-sm">{new Date(earning.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">Level {earning.level}</td>
                  <td className="px-4 py-3 text-sm capitalize">{earning.commissionType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    +{parseFloat(earning.commissionAmount).toFixed(2)} {earning.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Referrals;

