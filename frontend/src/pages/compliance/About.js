import React from 'react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About LibertyPath Ltd.</h1>
      
      <div className="prose max-w-none bg-white rounded-lg shadow p-8">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Who We Are</h2>
          <p className="text-gray-700 mb-4">
            LibertyPath Ltd. is a participation and rewards platform based in Liberia. We help users
            earn daily income by participating through active packages and completing tasks.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            Our mission is to make daily participation rewarding, transparent, and reliable for every
            member of the LibertyPath community.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Participation Notice</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-yellow-800 mb-2">
              <strong>LibertyPath is a participation and rewards platform.</strong>
            </p>
            <p className="text-yellow-800">
              Users earn daily income based on their active packages and task participation. Earned
              rewards are guaranteed and the company is obligated to pay them according to the package
              terms and limits.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Register and purchase one or more participation packages</li>
            <li>Complete daily tasks during your package period</li>
            <li>Earn daily income based on your package</li>
            <li>Rewards are credited to your wallet</li>
            <li>Withdrawals are processed anytime and completed within 24 hours on business days</li>
            <li>Saturday and Sunday requests are processed on Monday</li>
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p className="text-gray-700">
            For inquiries, please contact us at:
            <br />
            Email: support@libertypath.com
            <br />
            Address: Liberia
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;

