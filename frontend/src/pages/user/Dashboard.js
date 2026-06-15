import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';

const Dashboard = () => {
  const { user, isStaff, getStaffHomePath, loading: authLoading } = useAuth();
  const { dashboard, hasApprovedDeposit, refresh: refreshWhatsApp } = useWhatsApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [showMarch15PromoPopup, setShowMarch15PromoPopup] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  // March 15 promo window: same as backend (Mar 4 - Mar 15, 11:59 PM). Use client date so banner/popup show even if API fails or returns inactive.
  const MARCH15_PROMO_START = new Date('2026-03-04T00:00:00.000');
  const MARCH15_PROMO_END = new Date('2026-03-15T23:59:59.999');
  const isClientInPromoWindow = () => {
    const now = new Date();
    return now >= MARCH15_PROMO_START && now <= MARCH15_PROMO_END;
  };
  const promoActive = referralData?.march15Promo?.active === true || isClientInPromoWindow();

  const MARCH15_PROMO_CONTENT = (
    <>
      <p className="font-semibold text-center mb-2">🔥🇱🇷 LIBERTYPATH MARCH 15 HOLIDAY SPECIAL! 🇱🇷🔥</p>
      <p className="font-semibold text-center mb-3">🎉 Celebrate the Holiday by Earning More! 🎉</p>
      <p className="font-semibold mb-2">🚀 REFER & EARN INSTANTLY!</p>
      <p className="text-sm mb-2">For a limited time only, LibertyPath is giving you an incredible opportunity to boost your earnings!</p>
      <p className="font-semibold mb-2">💰 Get 10% INSTANTLY</p>
      <p className="text-sm mb-2">When your referred user registers and deposits, you receive 10% of the deposit amount immediately!</p>
      <ul className="list-disc ml-5 text-sm space-y-1 mb-3">
        <li>✅ Refer a friend</li>
        <li>✅ They register</li>
        <li>✅ They deposit</li>
        <li>✅ You get 10% credited instantly</li>
      </ul>
      <p className="text-sm mb-2">It&apos;s that simple!</p>
      <p className="font-semibold mb-1">⏳ Promo Ends:</p>
      <p className="text-sm mb-2">🗓 March 15 ⏰ 11:59 PM (Midnight)</p>
      <p className="text-sm mb-3">No extensions. No delays. Once the clock hits 11:59 PM, the offer closes!</p>
      <p className="text-sm mb-2">🔥 The more friends you refer, 💵 The more instant bonuses you earn!</p>
      <p className="text-sm mb-3">This is the perfect time to grow your network and maximize your LibertyPath rewards.</p>
      <p className="font-semibold mb-2">📲 Start sharing your referral link NOW!</p>
      <p className="text-sm mb-2">Let&apos;s make this March 15 celebration profitable!</p>
      <p className="text-xs text-gray-500 mt-2">LibertyPath Ltd. | Participation & Rewards Platform | Empowering You Through Daily Engagement</p>
    </>
  );

  const fetchReferralData = useCallback(async () => {
    try {
      const res = await axios.get('/referrals/my');
      if (res.data?.data) {
        setReferralData(res.data.data);
      }
    } catch (error) {
      // Non-blocking; promo banner just won't show if this fails
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const walletRes = await axios.get('/wallet/balance');
      const wallet = walletRes.data.data.wallet;

      const packagesRes = await axios.get('/packages/my/packages');
      const packages = packagesRes.data?.data?.packages || [];
      const activePackages = packages.filter(p => p.status === 'active').length;

      setStats({
        balance: parseFloat(wallet.balance),
        totalEarned: parseFloat(wallet.totalEarned),
        activePackages
      });
      refreshWhatsApp(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshWhatsApp]);

  useEffect(() => {
    if (!authLoading && isStaff()) {
      navigate(getStaffHomePath(), { replace: true });
      return;
    }

    if (!authLoading && !isStaff()) {
      fetchStats();
      fetchReferralData();
    }
  }, [authLoading, isStaff, getStaffHomePath, navigate, fetchStats, fetchReferralData]);

  useEffect(() => {
    if (!promoActive || !user?.id) return;
    if (!sessionStorage.getItem('march15PromoPopupShown')) {
      setShowMarch15PromoPopup(true);
    }
  }, [promoActive, user]);

  useEffect(() => {
    if (authLoading || !user || isStaff() || !dashboard?.url) return;
    if (dashboard.type !== 'new') return;
    const key = `whatsappPromptDismissed:${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowWhatsAppPrompt(true);
    }
  }, [authLoading, user, isStaff, dashboard]);

  useEffect(() => {
    if (authLoading || !user || isStaff()) return;
    if (!user.hasWithdrawalPin) {
      setShowPinPrompt(true);
    } else {
      setShowPinPrompt(false);
    }
  }, [authLoading, user, isStaff]);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = window.navigator.standalone === true;
      setIsInstalled(standalone || iosStandalone);
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show loading while auth is loading or checking admin status
  if (authLoading || loading || isStaff()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    window.alert('To install the app, open your browser menu and tap "Add to Home Screen".');
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      {dashboard?.url && (
        <div className={`mb-6 p-5 rounded-xl border shadow-sm ${
          dashboard.type === 'official'
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {dashboard.type === 'official' ? 'Active member' : 'Welcome'}
              </p>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{dashboard.label}</h2>
              <p className="text-sm text-gray-600">{dashboard.description}</p>
            </div>
            <a
              href={dashboard.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white shrink-0 ${
                dashboard.type === 'official'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#25D366] hover:bg-[#20bd5a]'
              }`}
            >
              <span>💬</span>
              {dashboard.type === 'official' ? 'Join Official Group' : 'Join Chatroom'}
            </a>
          </div>
        </div>
      )}

      {!dashboard?.url && hasApprovedDeposit && (
        <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900">
          Your deposit is active. The official WhatsApp group link will appear here once admin enables it.
        </div>
      )}

      {/* March 15 Holiday Promo - Floating banner (all users when promo active) */}
      {promoActive && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="font-bold text-amber-800">🔥🇱🇷 LIBERTYPATH MARCH 15 HOLIDAY SPECIAL! 🇱🇷🔥</span>
              <span className="ml-2 text-amber-800"> Get 10% instantly when your referred friend registers and deposits. </span>
              <span className="text-amber-700 text-sm">Promo ends March 15, 11:59 PM.</span>
            </div>
            <Link
              to="/dashboard/referrals"
              className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-md font-medium hover:bg-amber-700"
            >
              Share referral link
            </Link>
          </div>
        </div>
      )}

      {showMarch15PromoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-800">March 15 Holiday Special</h2>
              <button
                onClick={() => {
                  sessionStorage.setItem('march15PromoPopupShown', '1');
                  setShowMarch15PromoPopup(false);
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-800 space-y-2">
              {MARCH15_PROMO_CONTENT}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  sessionStorage.setItem('march15PromoPopupShown', '1');
                  setShowMarch15PromoPopup(false);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Maybe later
              </button>
              <Link
                to="/dashboard/referrals"
                onClick={() => {
                  sessionStorage.setItem('march15PromoPopupShown', '1');
                  setShowMarch15PromoPopup(false);
                }}
                className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 text-center"
              >
                Share my referral link
              </Link>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppPrompt && dashboard?.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-2">{dashboard.label}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {dashboard.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => {
                  localStorage.setItem(`whatsappPromptDismissed:${user.id}`, '1');
                  setShowWhatsAppPrompt(false);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Maybe later
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(`whatsappPromptDismissed:${user.id}`, '1');
                  setShowWhatsAppPrompt(false);
                  window.open(dashboard.url, '_blank', 'noopener,noreferrer');
                }}
                className="px-4 py-2 rounded-md bg-[#25D366] text-white hover:bg-[#20bd5a]"
              >
                Join WhatsApp Chatroom
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-2">Set your Withdrawal PIN</h2>
            <p className="text-sm text-gray-600 mb-4">
              For your security, you must set a withdrawal PIN before requesting withdrawals.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setShowPinPrompt(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Maybe later
              </button>
              <Link
                to="/dashboard/profile"
                className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-center"
              >
                Set PIN Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {showUserGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">User Guide</h2>
              <button
                onClick={() => setShowUserGuide(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close user guide"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💳</span>
                  <h3 className="font-semibold">How to Deposit</h3>
                </div>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to your Wallet and choose a package.</li>
                  <li>Select a payment method (MTN or Orange).</li>
                  <li>Dial the USSD code and complete payment.</li>
                  <li>Submit the deposit request and wait for approval.</li>
                </ol>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💸</span>
                  <h3 className="font-semibold">How to Withdraw</h3>
                </div>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Set your Withdrawal PIN first.</li>
                  <li>Open Wallet and enter amount, number, and name.</li>
                  <li>Enter your Withdrawal PIN and submit.</li>
                  <li>Withdrawals are processed within 24 hours (weekends paid Monday).</li>
                </ol>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔐</span>
                  <h3 className="font-semibold">Set Withdrawal PIN</h3>
                </div>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to Profile.</li>
                  <li>Enter a 4–8 digit PIN and confirm it.</li>
                  <li>Save the PIN; you can update it anytime.</li>
                </ol>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤝</span>
                  <h3 className="font-semibold">Referral Guide</h3>
                </div>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open Referrals to copy your referral link/code.</li>
                  <li>Share with friends to register.</li>
                  <li>You earn a percentage of their daily income.</li>
                </ol>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserGuide(false)}
                className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Wallet Balance</div>
          <div className="text-2xl sm:text-3xl font-bold text-primary-600">
            {stats?.balance?.toFixed(2) || '0.00'} LRD
          </div>
          <Link to="/dashboard/wallet" className="text-primary-600 text-sm mt-2 inline-block">
            View Wallet →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Earned</div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            {stats?.totalEarned?.toFixed(2) || '0.00'} LRD
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Active Packages</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {stats?.activePackages || 0}
          </div>
          <Link to="/dashboard/packages" className="text-primary-600 text-sm mt-2 inline-block">
            View Packages →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition"
            >
              Install App
            </button>
          )}
          <Link
            to="/dashboard/packages"
            className="bg-primary-600 text-white p-4 rounded-lg text-center hover:bg-primary-700 transition"
          >
            Purchase Package
          </Link>
          <Link
            to="/dashboard/tasks"
            className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition"
          >
            Complete Tasks
          </Link>
          <Link
            to="/dashboard/referrals"
            className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition"
          >
            Invite Friends
          </Link>
          <button
            type="button"
            onClick={() => setShowUserGuide(true)}
            className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-900 transition"
          >
            User Guide
          </button>
          {dashboard?.url && (
          <a
            href={dashboard.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-white p-4 rounded-lg text-center transition ${
              dashboard.type === 'official'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#25D366] hover:bg-[#20bd5a]'
            }`}
          >
            {dashboard.type === 'official' ? 'Official WhatsApp Group' : 'Join WhatsApp Chatroom'}
          </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

