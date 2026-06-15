import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose max-w-none bg-white rounded-lg shadow p-8">
        <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly, including your name, email, phone number,
            and payment details needed to operate your account and process withdrawals.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use your information to provide participation services, process rewards and withdrawals,
            communicate updates, and improve your experience.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement industry-standard security measures to protect your data and keep your
            information safe.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Data Sharing</h2>
          <p className="text-gray-700 mb-4">
            We do not sell your personal information. We only share data with trusted service
            providers who help us operate the platform.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Your Rights</h2>
          <p className="text-gray-700 mb-4">
            You can access, update, or delete your personal information at any time. Contact us
            at support@libertypath.com for help.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">6. Cookies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies to enhance your experience. You can disable cookies in your browser settings.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">7. Contact</h2>
          <p className="text-gray-700">
            For privacy concerns, please contact us at privacy@libertypath.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;

