import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffHomePath, isStaffUser } from '../../utils/staffConfig';
import logo from '../../assets/liberty_path_logo.png';

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null); // ms timestamp
  const { login } = useAuth();
  const navigate = useNavigate();

  const cooldownSecondsLeft = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const t = setInterval(() => {
      // trigger re-render
      setCooldownUntil((prev) => prev);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailOrPhone) {
      alert('Please enter your email or phone number');
      return;
    }

    if (cooldownSecondsLeft > 0) {
      // Prevent repeated login requests while the backend rate limiter is active.
      alert(`Too many login attempts. Please wait ${cooldownSecondsLeft} seconds and try again.`);
      return;
    }

    setLoading(true);

    const isPhone = loginMethod === 'phone';
    const result = await login(emailOrPhone, password, isPhone);
    if (result.success && result.user) {
      const destination = isStaffUser(result.user)
        ? getStaffHomePath(result.user)
        : '/dashboard';
      navigate(destination);
    } else if (result.success) {
      navigate('/dashboard');
    } else if (result.retryAfterSeconds) {
      setCooldownUntil(Date.now() + result.retryAfterSeconds * 1000);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 border border-gray-100">
          <div className="flex justify-center">
            <img src={logo} alt="LibertyPath logo" className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LibertyPath Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your dashboard or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${
                  loginMethod === 'email'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${
                  loginMethod === 'phone'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Phone
              </button>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                {loginMethod === 'email' ? 'Email address' : 'Phone number'}
              </label>
              <input
                id="emailOrPhone"
                name="emailOrPhone"
                type={loginMethod === 'email' ? 'email' : 'tel'}
                autoComplete={loginMethod === 'email' ? 'email' : 'tel'}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:text-sm"
                placeholder={loginMethod === 'email' ? 'you@example.com' : 'Phone number'}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Link to="/recover" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || cooldownSecondsLeft > 0}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : cooldownSecondsLeft > 0 ? `Please wait (${cooldownSecondsLeft}s)` : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

