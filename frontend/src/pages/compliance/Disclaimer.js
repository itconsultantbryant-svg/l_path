import React from 'react';

const Disclaimer = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Participation Notice</h1>
      
      <div className="prose max-w-none bg-white rounded-lg shadow p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">Participation Notice</h2>
          <p className="text-red-800 mb-2">
            <strong>LibertyPath is a participation and rewards platform</strong>
          </p>
          <p className="text-red-800">
            Users earn daily income based on their active packages and participation. Earned rewards
            are guaranteed and the company is obligated to pay them according to package terms.
          </p>
        </div>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Participation and Earnings</h2>
          <p className="text-gray-700 mb-4">
            Participation is based on purchasing packages and completing daily tasks. Users earn
            daily income based on their package and participation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. Guaranteed Rewards</h2>
          <p className="text-gray-700 mb-4">
            Rewards are guaranteed for active packages and are credited to your wallet as you
            participate and complete tasks.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Package Duration</h2>
          <p className="text-gray-700 mb-4">
            Rewards are available during the active package period and are limited by the package
            duration and cap.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Withdrawals</h2>
          <p className="text-gray-700 mb-4">
            Withdrawals are processed anytime and completed within 24 hours on business days. Saturday and Sunday requests
            are processed on Monday.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Service Fees</h2>
          <p className="text-gray-700 mb-4">
            Withdrawals may include applicable service fees. Ensure you review fees before requesting
            a withdrawal.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">6. Participation Integrity</h2>
          <p className="text-gray-700 mb-4">
            All participation must follow platform guidelines. Abuse or fraudulent activity may
            result in account suspension.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">7. Support</h2>
          <p className="text-gray-700 mb-4">
            Our team is available to support members and ensure a reliable experience for all users.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">8. Contact</h2>
          <p className="text-gray-700 mb-4">
            For questions about participation or withdrawals, contact support@libertypath.com.
          </p>
        </section>

        <section className="mb-6 bg-yellow-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Acknowledgment</h2>
          <p className="text-gray-700">
            By using this platform, you acknowledge that you have read and understood this notice
            and will follow the participation guidelines.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Disclaimer;

