import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const RecoverAccount = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [channel, setChannel] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const searchAccounts = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast.error('Enter at least 3 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/auth/recovery/search', { query });
      setMatches(res.data.data.matches || []);
      setSelectedUser(null);
      setChannel('');
      setCodeSent(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!selectedUser || !channel) {
      toast.error('Select an account and delivery method.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/auth/recovery/send-otp', {
        userId: selectedUser.id,
        channel
      });
      toast.success('Recovery code sent.');
      setCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send recovery code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/auth/recovery/reset', {
        userId: selectedUser.id,
        code,
        password
      });
      toast.success(res.data?.message || 'Password reset successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900">Recover your account</h2>
        <p className="text-sm text-gray-600 mt-1">
          Search by email, phone, or name to find your account.
        </p>

        <form onSubmit={searchAccounts} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by email, phone, or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-60"
          >
            Search
          </button>
        </form>

        {matches.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Select your account</h3>
            <div className="space-y-2">
              {matches.map((match) => (
                <label key={match.id} className="flex items-center gap-3 border rounded px-3 py-2">
                  <input
                    type="radio"
                    name="account"
                    checked={selectedUser?.id === match.id}
                    onChange={() => setSelectedUser(match)}
                  />
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{match.name}</div>
                    <div className="text-xs text-gray-500">
                      {match.emailMasked || 'Email not set'} • {match.phoneMasked || 'Phone not set'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Receive your recovery code</h3>
            <div className="flex gap-2">
              {selectedUser.hasEmail && (
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`px-3 py-2 rounded border ${channel === 'email' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white'}`}
                >
                  Email
                </button>
              )}
              {selectedUser.hasPhone && (
                <button
                  type="button"
                  onClick={() => setChannel('phone')}
                  className={`px-3 py-2 rounded border ${channel === 'phone' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white'}`}
                >
                  Phone
                </button>
              )}
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || !channel}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
              >
                Send Code
              </button>
            </div>
          </div>
        )}

        {codeSent && (
          <form onSubmit={resetPassword} className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Enter recovery code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-60"
            >
              Reset Password
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-gray-600">
          Remembered your account? <Link to="/login" className="text-primary-600 hover:text-primary-700">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RecoverAccount;
