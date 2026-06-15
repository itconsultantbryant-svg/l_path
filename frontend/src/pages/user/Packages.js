import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
    fetchMyPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await axios.get('/packages');
      setPackages(res.data.data.packages);
    } catch (error) {
      toast.error('Error fetching packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPackages = async () => {
    try {
      const res = await axios.get('/packages/my/packages');
      setMyPackages(res.data.data.packages);
    } catch (error) {
      console.error('Error fetching my packages:', error);
    }
  };

  const purchasePackage = async (packageId) => {
    try {
      await axios.post(`/packages/${packageId}/purchase`);
      toast.success('Package purchased successfully!');
      fetchPackages();
      fetchMyPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Packages</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              <div className="text-3xl font-bold text-primary-600 mb-4">
                {parseFloat(pkg.price).toFixed(2)} LRD
              </div>
              <div className="space-y-2 mb-4 text-sm">
                <div>Duration: {pkg.durationDays} days</div>
                <div>Daily Reward: {parseFloat(pkg.dailyRewardAmount).toFixed(2)} LRD</div>
                {pkg.maxRewardAmount && (
                  <div>Max Reward: {parseFloat(pkg.maxRewardAmount).toFixed(2)} LRD</div>
                )}
              </div>
              <button
                onClick={() => purchasePackage(pkg.id)}
                className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">My Packages</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rewards Earned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="px-6 py-4 text-sm">{pkg.package?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pkg.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{parseFloat(pkg.totalRewardsEarned).toFixed(2)} LRD</td>
                    <td className="px-6 py-4 text-sm">{new Date(pkg.endDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;

