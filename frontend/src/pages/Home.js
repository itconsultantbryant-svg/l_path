import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/liberty_path_logo.png';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="LibertyPath logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to LibertyPath
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Join a participation and rewards platform that pays daily income based on your package.
          </p>
          <div className="flex justify-center space-x-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-400 transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Package</h3>
              <p className="text-gray-600">
                Pick one or more participation packages that match your goals.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Participate Daily</h3>
              <p className="text-gray-600">
                Complete daily tasks during your package period to earn income.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Daily Income</h3>
              <p className="text-gray-600">
                Rewards are guaranteed based on your active package and participation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="py-12 bg-yellow-50 border-t border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> LibertyPath is a participation and rewards platform. Users earn
              daily income based on their active package, and the company is obligated to pay earned
              rewards. Withdrawals can be processed anytime and are completed within 24 hours on business days. Saturday and Sunday
              requests are processed on Monday. Please review our
              <Link to="/terms" className="underline ml-1">Terms & Conditions</Link> and
              <Link to="/disclaimer" className="underline ml-1">Participation Notice</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

