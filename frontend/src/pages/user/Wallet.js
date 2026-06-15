import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Wallet = () => {
  const { user, token, fetchUser, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  /** Only for wallet balance fetch — never hide the whole page */
  const [walletLoading, setWalletLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [depositOptions, setDepositOptions] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [depositMethod, setDepositMethod] = useState('mtn');
  const [paymentReference, setPaymentReference] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNumber, setWithdrawalNumber] = useState('');
  const [withdrawalName, setWithdrawalName] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [pinSetup, setPinSetup] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinSetupLoading, setPinSetupLoading] = useState(false);
  const [showCurrentPinField, setShowCurrentPinField] = useState(false);
  const [withdrawalEta, setWithdrawalEta] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [now, setNow] = useState(Date.now());

  // AuthProvider fetches `/auth/me` when the token exists (not here — avoids 429 loops).
  // Load wallet data when JWT is present and bootstrap finished, even if /auth/me failed (e.g. 429).

  useEffect(() => {
    if (authLoading || !token) return;
    fetchWallet();
    fetchTransactions();
    fetchPackages();
    fetchDepositOptions();
    fetchWithdrawals();
  }, [authLoading, token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const res = await axios.get('/wallet/balance');
      setWallet(res.data.data.wallet);
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.msg ||
        '';
      if (status === 429) {
        toast.error('Too many requests. Please wait a few seconds and try again.');
      } else {
        toast.error(serverMsg || 'Error fetching wallet');
      }
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/wallet/transactions');
      setTransactions(res.data.data.transactions);
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.msg ||
        '';
      if (status === 429) {
        toast.error('Too many requests. Please wait a few seconds and try again.');
      } else if (serverMsg) {
        toast.error(serverMsg);
      }
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get('/packages');
      setPackages(res.data.data.packages || []);
    } catch (error) {
      const serverMsg = error?.response?.data?.message || 'Error fetching packages';
      toast.error(serverMsg);
    }
  };

  const fetchDepositOptions = async () => {
    try {
      const res = await axios.get('/wallet/deposit-options');
      setDepositOptions(res.data.data);
    } catch (error) {
      const serverMsg = error?.response?.data?.message || 'Error fetching deposit options';
      toast.error(serverMsg);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get('/wallet/withdrawals');
      setWithdrawals(res.data.data.withdrawals || []);
    } catch (error) {
      const serverMsg = error?.response?.data?.message || 'Error fetching withdrawals';
      toast.error(serverMsg);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);
      if (!selectedPackage) {
        toast.error('Please select a package to deposit for');
        return;
      }

      await axios.post('/wallet/deposit', {
        amount: parseFloat(selectedPackage.price),
        paymentMethod: 'mobile_money',
        paymentReference: paymentReference || undefined
      });
      toast.success('Deposit request submitted');
      setPaymentReference('');
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit request failed');
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      if (!withdrawalPin || !withdrawalPin.trim()) {
        toast.error('Withdrawal PIN is required.');
        return;
      }
      const res = await axios.post('/wallet/withdrawal', {
        amount: parseFloat(withdrawalAmount),
        paymentMethod: 'mobile_money',
        accountNumber: withdrawalNumber,
        accountName: withdrawalName,
        withdrawalPin: withdrawalPin.trim()
      });
      const expectedAt = res.data?.data?.expectedProcessingAt;
      if (expectedAt) {
        setWithdrawalEta(expectedAt);
      }
      toast.success('Withdrawal request submitted');
      setWithdrawalAmount('');
      setWithdrawalNumber('');
      setWithdrawalName('');
      setWithdrawalPin('');
      fetchWallet();
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal request failed');
    }
  };

  const handlePinSetupChange = (e) => {
    setPinSetup({
      ...pinSetup,
      [e.target.name]: e.target.value
    });
  };

  const handlePinSetup = async (e) => {
    e.preventDefault();
    if (pinSetup.newPin.length < 4 || pinSetup.newPin.length > 8) {
      toast.error('PIN must be between 4 and 8 digits.');
      return;
    }
    if (pinSetup.newPin !== pinSetup.confirmPin) {
      toast.error('PIN confirmation does not match.');
      return;
    }
    if (showCurrentPinField && !pinSetup.currentPin?.trim()) {
      toast.error('Enter your current PIN to update.');
      return;
    }
    setPinSetupLoading(true);
    setShowCurrentPinField(false);
    try {
      const body = { pin: String(pinSetup.newPin).trim() };
      if (pinSetup.currentPin?.trim()) {
        body.currentPin = String(pinSetup.currentPin).trim();
      }
      await axios.put('/users/withdrawal-pin', body);
      toast.success('Withdrawal PIN set successfully.');
      setPinSetup({ currentPin: '', newPin: '', confirmPin: '' });
      fetchUser({ silent: true });
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || (Array.isArray(data?.errors) && data.errors[0]?.msg) || '';
      if (msg.includes('Current PIN is required') || msg.includes('Current PIN is incorrect')) {
        setShowCurrentPinField(true);
      }
      toast.error(msg || 'Failed to set withdrawal PIN');
    } finally {
      setPinSetupLoading(false);
    }
  };

  const showAccountLoadBanner = !user && authLoading === false;

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);
  const depositAmount = selectedPackage ? `${parseFloat(selectedPackage.price)}` : '';
  const depositNumber = depositMethod === 'mtn'
    ? (depositOptions?.mtn?.number || 'N/A')
    : (depositOptions?.orange?.number || 'N/A');
  const ussdTemplate = depositMethod === 'mtn'
    ? depositOptions?.mtn?.ussdTemplate
    : depositOptions?.orange?.ussdTemplate;
  const ussdCode = ussdTemplate
    ? ussdTemplate.replace('{amount}', depositAmount || 'AMOUNT')
    : '';
  const canDial = Boolean(ussdCode && depositAmount);
  const dialLink = canDial ? `tel:${ussdCode.replace('#', '%23')}` : '#';
  const nextPendingWithdrawal = withdrawals
    .filter((withdrawal) => withdrawal.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const expectedProcessingAt = nextPendingWithdrawal?.metadata?.expectedProcessingAt;
  const expectedProcessingTime = expectedProcessingAt ? new Date(expectedProcessingAt).getTime() : null;
  const remainingMs = expectedProcessingTime ? expectedProcessingTime - now : null;
  const remainingMinutes = remainingMs ? Math.max(0, Math.ceil(remainingMs / 60000)) : null;
  const countdownText = remainingMinutes !== null
    ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
    : null;

  return (
    <div>
      {showAccountLoadBanner && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-6">
          <div className="font-semibold mb-1">We are having trouble loading your account</div>
          <div className="text-sm mb-3">
            Please wait a moment and try again. Your wallet data will appear once the server responds.
          </div>
          <button
            onClick={() => fetchUser({ silent: true })}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Try again
          </button>
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Wallet</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Balance</h2>
          {walletLoading ? (
            <div className="text-gray-600 py-4">Loading balance…</div>
          ) : (
            <>
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">
                {parseFloat(wallet?.balance || 0).toFixed(2)} LRD
              </div>
              <div className="text-sm text-gray-500">
                Total Earned: {parseFloat(wallet?.totalEarned || 0).toFixed(2)} LRD
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              fetchWallet();
              fetchTransactions();
              fetchPackages();
              fetchDepositOptions();
              fetchWithdrawals();
            }}
            className="mt-3 text-sm text-primary-600 hover:text-primary-800 underline"
          >
            Reload wallet data
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Package</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Choose a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {parseFloat(pkg.price).toFixed(2)} LRD
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="orange">Orange Money</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Amount: <span className="font-semibold">{depositAmount || '0.00'} LRD</span>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                <div className="font-medium text-gray-700 mb-1">
                  Deposit number: {depositNumber || 'Loading...'}
                </div>
                <div className="font-mono text-gray-800 break-all">
                  {ussdCode || 'USSD code will appear after selecting a package.'}
                </div>
                <div className="mt-2">
                  <a
                    href={dialLink}
                    aria-disabled={!canDial}
                    className={`inline-flex items-center px-3 py-2 rounded text-sm ${
                      canDial
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Dial to Pay
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  placeholder="Transaction ID or note"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Submit Deposit Request
              </button>
            </form>
            <form onSubmit={handleWithdrawal} className="space-y-2">
              <input
                type="number"
                step="0.01"
                placeholder="Amount (min: 500)"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
                min="500"
              />
              <input
                type="text"
                placeholder="Mobile money number"
                value={withdrawalNumber}
                onChange={(e) => setWithdrawalNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Name on the number"
                value={withdrawalName}
                onChange={(e) => setWithdrawalName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="password"
                placeholder="Withdrawal PIN"
                value={withdrawalPin}
                onChange={(e) => setWithdrawalPin(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                disabled={!user?.hasWithdrawalPin}
                className="w-full bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                Withdraw to Mobile Money
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: 15% service fee applies to withdrawals. Processing happens anytime and is completed within 24 hours; weekend requests are paid on Monday.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Withdrawal PIN is required for every request.
          </p>
          {!user?.hasWithdrawalPin && (
            <p className="text-xs text-red-600 mt-2">
              Set your withdrawal PIN in Profile before requesting a withdrawal.
            </p>
          )}
          {withdrawalEta && (
            <p className="text-xs text-gray-600 mt-1">
              Expected processing: {new Date(withdrawalEta).toLocaleString()}
            </p>
          )}
          {expectedProcessingAt && (
            <p className="text-xs text-gray-600 mt-1">
              Latest pending withdrawal ETA: {new Date(expectedProcessingAt).toLocaleString()}
              {countdownText ? ` (about ${countdownText} remaining)` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-1">Withdrawal PIN Setup</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set or update your withdrawal PIN here.
        </p>
        <form onSubmit={handlePinSetup} className="space-y-3 max-w-md">
          {user?.hasWithdrawalPin && (
            <input
              type="password"
              name="currentPin"
              placeholder="Current PIN (required to update)"
              value={pinSetup.currentPin}
              onChange={handlePinSetupChange}
              className="w-full border rounded px-3 py-2"
            />
          )}
          <input
            type="password"
            name="newPin"
            placeholder="New PIN (4-8 digits)"
            value={pinSetup.newPin}
            onChange={handlePinSetupChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="confirmPin"
            placeholder="Confirm PIN"
            value={pinSetup.confirmPin}
            onChange={handlePinSetupChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={pinSetupLoading}
            className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {pinSetupLoading ? 'Saving...' : showCurrentPinField ? 'Update PIN' : 'Set PIN'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.slice(0, 10).map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm capitalize">{tx.type}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${
                    tx.type === 'reward' || tx.type === 'referral' || tx.type === 'deposit' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {tx.type === 'withdrawal' || tx.type === 'fee' ? '-' : '+'}
                    {parseFloat(tx.amount).toFixed(2)} {tx.currency}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
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

export default Wallet;

