import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>

          <div className="prose prose-sm max-w-none space-y-6">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700">
                This Knowledge Librarian Resource Center ("the System") is designed to capture 
                and retain institutional knowledge from departing employees in an anonymous manner. 
                This privacy policy explains how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">From Uploaders (Departing Employees):</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Work-related information:</strong> Role context, responsibilities, tools, skills, processes, and advice</li>
                <li><strong>Files:</strong> Process documents, templates, and work examples</li>
                <li><strong>Metadata:</strong> Department, position level, experience range, team size (no names or emails)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">From Users (Admins/Seekers):</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account information:</strong> Email address and encrypted password</li>
                <li><strong>Usage data:</strong> Login timestamps, search queries (for system improvement only)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Anonymity & Data Minimization</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Submissions are completely anonymous - no personal identifiers are collected or stored</li>
                <li>Uploaded files are renamed to random identifiers (UUIDs)</li>
                <li>One-time upload codes expire after 24 hours and cannot be traced back to individuals</li>
                <li>AI processing scans for and flags potential personal information before approval</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Knowledge Retention:</strong> To preserve and share institutional knowledge within the organization</li>
                <li><strong>AI Processing:</strong> To automatically summarize, categorize, and extract keywords from submissions</li>
                <li><strong>Search & Discovery:</strong> To enable current employees to find relevant knowledge and resources</li>
                <li><strong>System Administration:</strong> To manage user accounts and moderate content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing & Third Parties</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>OpenAI API:</strong> Anonymous submission content is processed by OpenAI for summarization (no personal data sent)</li>
                <li><strong>Supabase:</strong> Data storage and authentication provider (GDPR/SOC 2 compliant)</li>
                <li><strong>No external sharing:</strong> Your data is never sold or shared with third parties for marketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Industry-standard encryption for data in transit and at rest</li>
                <li>Row-level security policies to prevent unauthorized access</li>
                <li>Private storage buckets for uploaded files</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Approved submissions:</strong> Retained indefinitely for organizational knowledge</li>
                <li><strong>Rejected submissions:</strong> Deleted after 30 days</li>
                <li><strong>Upload codes:</strong> Deleted 7 days after use</li>
                <li><strong>User accounts:</strong> Retained while employment is active</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access your account information</li>
                <li>Request deletion of your account</li>
                <li>Withdraw consent (though anonymous submissions cannot be identified or deleted)</li>
                <li>Raise concerns about data processing practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Information</h2>
              <p className="text-gray-700">
                For any privacy-related questions or concerns, please contact:<br />
                <strong>Email:</strong> privacy@yourcompany.com<br />
                <strong>Data Protection Officer:</strong> [Name/Department]
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. Changes will be posted on this page 
                with an updated "Last Updated" date. Continued use of the system constitutes acceptance 
                of any changes.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;