import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, Search, Shield } from 'lucide-react';
import kadoshLogo from '../assets/kadoshAI.png';
import BackgroundMusic from '../components/BackgroundMusic';
import themeMusic from '../assets/librarian-theme.mp3';

function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
       <BackgroundMusic src={themeMusic} />
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 animate-slideDown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 group">
              <BookOpen className="w-8 h-8 text-blue-600 transition-transform group-hover:rotate-12" />
              <span className="text-xl font-bold text-gray-900">Knowledge Librarian</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/login')}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-all hover:scale-105"
              >
                Admin
              </button>
              <button
                onClick={() => navigate('/seeker/login')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all hover:scale-105 hover:shadow-lg"
              >
                Search Knowledge
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fadeIn">
              Preserve Institutional Knowledge,<br />
              <span className="text-blue-600 animate-pulse-slow">Anonymously & Securely</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeIn" style={{animationDelay: '0.2s'}}>
              Capture valuable insights from departing employees and make them searchable for your current team.
              No personal data stored, completely anonymous.
            </p>
            <div className="flex justify-center space-x-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
              <button
                onClick={() => navigate('/upload')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg hover:shadow-2xl transition-all hover:scale-110 hover:-translate-y-1 animate-bounce-subtle"
              >
                Enter Upload Code
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-fadeIn" style={{animationDelay: '0.6s'}}>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Anonymous Upload</h3>
              <p className="text-gray-600">
                Departing employees share knowledge via secure one-time codes. No accounts, no tracking, completely anonymous.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-fadeIn" style={{animationDelay: '0.8s'}}>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Search</h3>
              <p className="text-gray-600">
                AI-powered categorization and keyword extraction makes finding relevant knowledge instant and effortless.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-fadeIn" style={{animationDelay: '1s'}}>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Enterprise-grade security with row-level policies. Only approved content is searchable by your team.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24 animate-fadeIn" style={{animationDelay: '1.2s'}}>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:animate-bounce group-hover:shadow-lg transition-all">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Admin Creates Code</h3>
                <p className="text-gray-600">Generate a secure 24-hour upload code for departing employee</p>
              </div>

              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:animate-bounce group-hover:shadow-lg transition-all" style={{animationDelay: '0.1s'}}>
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Employee Shares Knowledge</h3>
                <p className="text-gray-600">Complete anonymous questionnaire and upload relevant documents</p>
              </div>

              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:animate-bounce group-hover:shadow-lg transition-all" style={{animationDelay: '0.2s'}}>
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Team Discovers Insights</h3>
                <p className="text-gray-600">Search and access AI-summarized knowledge when needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <span>Copyright © {new Date().getFullYear()}</span>
            <img
              src={kadoshLogo}
              alt="Kadosh AI"
              className="h-5 w-auto object-contain"
            />
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;