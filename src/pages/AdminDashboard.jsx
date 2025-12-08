import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  BookOpen, LogOut, Plus, Users, FileText, Clock,
  CheckCircle, XCircle, Eye, Download, UserPlus, Copy, Check
} from 'lucide-react';
import { useToast } from '../components/Toast';

function AdminDashboard({ user, profile }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [submissions, setSubmissions] = useState([]);
  const [codes, setCodes] = useState([]);
  const [seekers, setSeekers] = useState([]);

  // UX States
  const [loading, setLoading] = useState(true); // Global loading (full screen)
  const [isCreating, setIsCreating] = useState(false); // Button loading (just for create)

  const [newCodeGenerated, setNewCodeGenerated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    activeSeekers: 0
  });

  // New seeker form state
  const [newSeeker, setNewSeeker] = useState({
    email: '',
    password: '',
    department: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Modified fetchData to allow "silent" updates (background refresh)
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from('knowledge_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      setSubmissions(submissionsData || []);

      // Fetch upload codes
      const { data: codesData } = await supabase
        .from('upload_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setCodes(codesData || []);

      // Fetch seekers
      const { data: seekersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'seeker')
        .order('created_at', { ascending: false });

      setSeekers(seekersData || []);

      // Calculate stats
      setStats({
        totalSubmissions: submissionsData?.length || 0,
        pendingSubmissions: submissionsData?.filter(s => s.status === 'pending').length || 0,
        approvedSubmissions: submissionsData?.filter(s => s.status === 'approved').length || 0,
        activeSeekers: seekersData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generateUploadCode = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('upload_codes')
        .insert({
          admin_creator: user.id,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setNewCodeGenerated(data.code);
      fetchData(true); // Silent refresh
    } catch (error) {
      console.error('Error generating code:', error);
      addToast('Failed to generate code', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approveSubmission = async (submissionId) => {
    try {
      const { error } = await supabase
        .from('knowledge_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      fetchData(true); // Silent refresh
      setSelectedSubmission(null);
      addToast('Submission approved successfully!', 'success');
    } catch (error) {
      console.error('Error approving submission:', error);
      addToast('Failed to approve submission', 'error');
    }
  };

  const rejectSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to reject this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('knowledge_submissions')
        .update({
          status: 'rejected'
        })
        .eq('id', submissionId);

      if (error) throw error;

      fetchData(true); // Silent refresh
      setSelectedSubmission(null);
      addToast('Submission rejected', 'info');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      addToast('Failed to reject submission', 'error');
    }
  };

  // --- FIXED CREATE SEEKER FUNCTION ---
  const createSeeker = async (e) => {
    // 1. STOP PAGE RELOAD
    e.preventDefault();
    
    // 2. Start Button Loading
    setIsCreating(true);

    // 3. Use actual form data from state
    const email = newSeeker.email;
    const password = newSeeker.password;
    const department = newSeeker.department;

    try {
      const { data, error } = await supabase.functions.invoke('create-seeker', {
        body: {
          email: email,
          password: password,
          department: department
        }
      });

      if (error) throw error;

      console.log('Success:', data);
      addToast('Seeker created successfully!', 'success');

      // Clear form
      setNewSeeker({ email: '', password: '', department: '' });

      // Refresh list without reloading page
      await fetchData(true);

    } catch (error) {
      console.error('Function error:', error);
      // Handle the specific error message from the Edge Function
      const msg = error.message || 'Unknown error';
      addToast('Failed to create seeker: ' + msg, 'error');
    } finally {
      // 4. Stop Button Loading
      setIsCreating(false);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalSubmissions}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingSubmissions}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approvedSubmissions}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Seekers</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.activeSeekers}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'submissions', 'codes', 'seekers'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={generateUploadCode}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Generate Upload Code
                      </button>
                      <button
                        onClick={() => setActiveTab('seekers')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Add New Seeker
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
                    <div className="space-y-2">
                      {submissions.slice(0, 5).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{sub.department}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {newCodeGenerated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Code Generated!</h3>
                    <div className="flex items-center space-x-3">
                      <code className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-lg font-mono text-lg">
                        {newCodeGenerated}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newCodeGenerated)}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-blue-800 mt-3">
                      Share this code with the departing employee. Valid for 24 hours.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Knowledge Submissions</h2>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      All ({submissions.length})
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      Pending ({stats.pendingSubmissions})
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {submissions.map(submission => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {submission.status}
                            </span>
                            <span className="text-sm text-gray-600">{submission.department}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{submission.position_level}</span>
                          </div>
                           
                          {submission.ai_summary ? (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {submission.ai_summary}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 italic mb-2">AI processing pending...</p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {submission.ai_category?.map(cat => (
                              <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Submitted {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Codes Tab */}
            {activeTab === 'codes' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Upload Codes</h2>
                  <button
                    onClick={generateUploadCode}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Generate New Code
                  </button>
                </div>

                <div className="space-y-3">
                  {codes.map(code => {
                    const isExpired = new Date(code.expires_at) < new Date();
                    return (
                      <div
                        key={code.code}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center space-x-4">
                          <code className="px-3 py-2 bg-gray-100 rounded font-mono text-sm">
                            {code.code}
                          </code>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            code.used ? 'bg-gray-100 text-gray-600' :
                            isExpired ? 'bg-red-100 text-red-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {code.used ? 'Used' : isExpired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {code.used ? `Used ${new Date(code.used_at).toLocaleDateString()}` : 
                           `Expires ${new Date(code.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seekers Tab - UPDATED */}
            {activeTab === 'seekers' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Seeker</h2>
                  <form onSubmit={createSeeker} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={newSeeker.email}
                        onChange={(e) => setNewSeeker({ ...newSeeker, email: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Temporary password"
                        value={newSeeker.password}
                        onChange={(e) => setNewSeeker({ ...newSeeker, password: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        value={newSeeker.department}
                        onChange={(e) => setNewSeeker({ ...newSeeker, department: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCreating} // Disabled when loading
                      className={`mt-4 px-6 py-2 text-white rounded-lg flex items-center justify-center ${
                        isCreating ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Seeker Account'
                      )}
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Seekers ({seekers.length})</h2>
                  <div className="space-y-2">
                    {seekers.map(seeker => (
                      <div
                        key={seeker.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{seeker.email}</p>
                          <p className="text-sm text-gray-600">{seeker.department || 'No department'}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(seeker.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedSubmission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedSubmission.status}
                </span>
                {selectedSubmission.ai_processed && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    AI Processed
                  </span>
                )}
              </div>

              {/* Role Context */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Role Context</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.position_level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.experience_range}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Team Size:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.team_size_range}</span>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {selectedSubmission.ai_summary && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.ai_summary}</p>
                  </div>
                  {selectedSubmission.ai_keywords && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSubmission.ai_keywords.map(keyword => (
                        <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main Content */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Main Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {selectedSubmission.main_responsibilities?.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Essential Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.essential_tools?.map(tool => (
                    <span key={tool} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Critical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.critical_skills?.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSubmission.learning_resources && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Learning Path</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.learning_resources}</p>
                </div>
              )}

              {selectedSubmission.common_problems && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Common Problems</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.common_problems}</p>
                </div>
              )}

              {selectedSubmission.solutions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Solutions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.solutions}</p>
                </div>
              )}

              {selectedSubmission.final_advice && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Final Advice</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.final_advice}</p>
                  </div>
                </div>
              )}

              {/* Files */}
              {(selectedSubmission.process_files?.length > 0 || 
                selectedSubmission.template_files?.length > 0 || 
                selectedSubmission.example_files?.length > 0) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Attached Files</h3>
                  <div className="space-y-2">
                    {selectedSubmission.process_files?.map(file => (
                      <div key={file} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">Process: {file}</span>
                      </div>
                    ))}
                    {selectedSubmission.template_files?.map(file => (
                      <div key={file} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">Template: {file}</span>
                      </div>
                    ))}
                    {selectedSubmission.example_files?.map(file => (
                      <div key={file} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">Example: {file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => approveSubmission(selectedSubmission.id)}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Submission
                  </button>
                  <button
                    onClick={() => rejectSubmission(selectedSubmission.id)}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Submission
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;