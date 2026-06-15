import React from 'react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
      
      <div className="prose max-w-none bg-white rounded-lg shadow p-8">
        <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to LibertyPath Ltd. ("we," "our," or "us"). These Terms and Conditions govern your 
            use of our participation and rewards platform.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. Participation & Rewards</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-yellow-800 font-semibold mb-2">Participation Notice</p>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>This is a participation and rewards platform, not an investment.</li>
              <li>Rewards are earned daily based on your active package and participation.</li>
              <li>LibertyPath is obligated to pay earned rewards.</li>
              <li>Rewards are time-bound to the package duration and capped by package limits.</li>
            </ul>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Participation Packages</h2>
          <p className="text-gray-700 mb-4">
            Participation packages give you access to daily tasks and daily income. Packages have a
            defined duration and reward caps. Rewards are available during the active period of each package.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Task Completion</h2>
          <p className="text-gray-700 mb-4">
            Tasks must be completed according to platform guidelines. Abuse or fraudulent activity
            may result in account suspension.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Withdrawals</h2>
          <p className="text-gray-700 mb-4">
            Withdrawals are subject to minimum amounts and service fees. Approved withdrawals are
            processed anytime and completed within 24 hours on business days. Saturday and Sunday requests are processed
            on Monday.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">6. Referral Program</h2>
          <p className="text-gray-700 mb-4">
            Our referral program is activity-based. Commissions are earned when referred users 
            complete tasks or activities, not based on deposits alone. Referral commissions are capped.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">7. Account Termination</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to suspend or terminate accounts that violate these terms or engage 
            in fraudulent activity.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">8. Service Commitment</h2>
          <p className="text-gray-700 mb-4">
            LibertyPath is committed to providing stable access to the platform and paying earned
            rewards as outlined in these terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">9. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify these terms at any time. Continued use of the platform 
            constitutes acceptance of modified terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
          <p className="text-gray-700">
            For questions about these terms, please contact us at support@libertypath.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;

