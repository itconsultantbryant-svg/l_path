import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateUser, fetchUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinLoading, setPinLoading] = useState(false);
  const [showCurrentPinField, setShowCurrentPinField] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePinChange = (e) => {
    setPinData({
      ...pinData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put('/users/profile', formData);
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully');
      fetchUser({ silent: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pinData.newPin.length < 4 || pinData.newPin.length > 8) {
      toast.error('PIN must be between 4 and 8 digits.');
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      toast.error('PIN confirmation does not match.');
      return;
    }
    if (showCurrentPinField && !pinData.currentPin?.trim()) {
      toast.error('Enter your current PIN to update.');
      return;
    }
    setPinLoading(true);
    setShowCurrentPinField(false);
    try {
      const body = { pin: String(pinData.newPin).trim() };
      if (pinData.currentPin?.trim()) {
        body.currentPin = String(pinData.currentPin).trim();
      }
      await axios.put('/users/withdrawal-pin', body);
      toast.success('Withdrawal PIN set successfully.');
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      fetchUser({ silent: true });
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || (Array.isArray(data?.errors) && data.errors[0]?.msg) || '';
      if (msg.includes('Current PIN is required') || msg.includes('Current PIN is incorrect')) {
        setShowCurrentPinField(true);
      }
      toast.error(msg || 'Failed to set withdrawal PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Profile</h1>

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-6">
          <div className="font-semibold mb-1">We are having trouble loading your account</div>
          <div className="text-sm mb-3">
            Please wait a moment and try again. Your profile details will appear once the server responds.
          </div>
          <button
            onClick={() => fetchUser({ silent: true })}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Try again
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KYC Status
            </label>
            <div className={`inline-block px-3 py-1 rounded text-sm ${
              user?.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
              user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {user?.kycStatus || 'pending'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referral Code
            </label>
            <input
              type="text"
              value={user?.referralCode || ''}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl mt-6">
        <h2 className="text-xl font-semibold mb-1">Withdrawal PIN</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set a PIN to protect withdrawals. You will be asked for this PIN before every withdrawal.
        </p>
        <form onSubmit={handlePinSubmit} className="space-y-4">
          {(user?.hasWithdrawalPin || showCurrentPinField) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current PIN (required to update)
              </label>
              <input
                type="password"
                name="currentPin"
                placeholder="Enter current PIN"
                value={pinData.currentPin}
                onChange={handlePinChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New PIN (4-8 digits)
            </label>
            <input
              type="password"
              name="newPin"
              value={pinData.newPin}
              onChange={handlePinChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm PIN
            </label>
            <input
              type="password"
              name="confirmPin"
              value={pinData.confirmPin}
              onChange={handlePinChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={pinLoading}
            className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {pinLoading ? 'Saving...' : showCurrentPinField ? 'Update PIN' : 'Set PIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

