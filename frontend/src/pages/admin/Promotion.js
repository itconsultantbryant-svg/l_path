import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminPromotion = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      const res = await axios.get('/admin/promotion');
      setData(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading promotion report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading promotion report...</p>
        </div>
      </div>
    );
  }

  const { promo, summary = {}, entries = [] } = data || {};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔥 March 15 Holiday Promotion
        </h1>
        <p className="text-gray-600">
          Monitor referred users, their deposits, and 10% bonus paid to referrers
        </p>
      </div>

      {/* Promo status */}
      <div
        className={`rounded-lg border-2 p-4 mb-6 ${
          promo?.active
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-semibold">
              Status: {promo?.active ? '🟢 Active' : '⚫ Ended'}
            </span>
            <span className="mx-2">|</span>
            <span className="text-sm">
              Ends: {promo?.endsAt ? new Date(promo.endsAt).toLocaleString() : 'March 15, 11:59 PM'}
            </span>
          </div>
          <p className="text-sm">
            Only new users referred during the promo (Mar 4 – Mar 15) qualify for the 10% instant
            bonus when they deposit.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Bonus transactions</div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalEntries ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total deposit volume (referred users)</div>
          <div className="text-2xl font-bold text-blue-700">
            {(summary.totalDepositVolume ?? 0).toFixed(2)} LRD
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total 10% bonus paid to referrers</div>
          <div className="text-2xl font-bold text-green-700">
            {(summary.totalBonusPaid ?? 0).toFixed(2)} LRD
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bonus payments</h2>
          <p className="text-sm text-gray-500">
            Referred user, referrer, deposit amount, and bonus paid
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred user (new)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred by (old user)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % to referrer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid at
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.referredUser ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {row.referredUser.firstName} {row.referredUser.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.referredUser.email || row.referredUser.phone}
                          </div>
                          <div className="text-xs text-gray-400">
                            Registered: {new Date(row.referredUser.registeredAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.referredBy ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {row.referredBy.firstName} {row.referredBy.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.referredBy.email || row.referredBy.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {row.depositAmount.toFixed(2)} {row.currency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {row.commissionRate}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                      {row.commissionAmount.toFixed(2)} {row.currency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(row.paidAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {row.referredUser?.id && (
                        <Link
                          to={`/admin/users/${row.referredUser.id}`}
                          className="text-yellow-600 hover:text-yellow-800 font-medium"
                        >
                          View referred user
                        </Link>
                      )}
                      {row.referredBy?.id && (
                        <>
                          <span className="text-gray-300 mx-1">|</span>
                          <Link
                            to={`/admin/users/${row.referredBy.id}`}
                            className="text-yellow-600 hover:text-yellow-800 font-medium"
                          >
                            View referrer
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No promotion bonus payments yet. When a referred user (registered during the
                    promo) has a deposit approved, the referrer will receive 10% here.
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

export default AdminPromotion;
