import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, downloadFile } from '../lib/supabase';
import { 
  ArrowLeft, Download, Briefcase, Clock, Users, 
  FileText, Lightbulb, MessageSquare, BookOpen 
} from 'lucide-react';

function ResourceDetail({ user, profile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_submissions')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setSubmission(data);
    } catch (error) {
      console.error('Error fetching submission:', error);
      alert('Failed to load resource');
      navigate('/seeker/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (bucket, fileName) => {
    try {
      const blob = await downloadFile(bucket, fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Resource not found</p>
          <button
            onClick={() => navigate('/seeker/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/seeker/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Search
          </button>
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Resource</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Context Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Context</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Position Level</p>
                <p className="font-medium text-gray-900">{submission.position_level}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium text-gray-900">{submission.department}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-medium text-gray-900">{submission.experience_range}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Size</p>
                <p className="font-medium text-gray-900">{submission.team_size_range}</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          {submission.ai_category && submission.ai_category.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {submission.ai_category.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Summary */}
        {submission.ai_summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{submission.ai_summary}</p>
            </div>
            {submission.ai_keywords && submission.ai_keywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Key Topics</p>
                <div className="flex flex-wrap gap-2">
                  {submission.ai_keywords.map(keyword => (
                    <span key={keyword} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm border border-blue-200">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Responsibilities */}
        {submission.main_responsibilities && submission.main_responsibilities.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Main Responsibilities</h2>
            <ul className="space-y-3">
              {submission.main_responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Essential Tools */}
        {submission.essential_tools && submission.essential_tools.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Essential Tools</h2>
            <div className="flex flex-wrap gap-2">
              {submission.essential_tools.map(tool => (
                <span key={tool} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Critical Skills */}
        {submission.critical_skills && submission.critical_skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Critical Skills</h2>
            <div className="flex flex-wrap gap-2">
              {submission.critical_skills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Path */}
        {submission.learning_resources && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Path</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.learning_resources}</p>
          </div>
        )}

        {/* Common Problems & Solutions */}
        {(submission.common_problems || submission.solutions) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Problems & Solutions</h2>
            {submission.common_problems && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Problems:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{submission.common_problems}</p>
              </div>
            )}
            {submission.solutions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Solutions:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{submission.solutions}</p>
              </div>
            )}
          </div>
        )}

        {/* Communication Methods */}
        {submission.communication_methods && submission.communication_methods.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Communication Methods</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {submission.communication_methods.map(method => (
                <div key={method} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">{method}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Tips */}
        {submission.collaboration_tips && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Collaboration Tips</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.collaboration_tips}</p>
          </div>
        )}

        {/* Handoff Advice */}
        {submission.handoff_advice && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Handoff Advice</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.handoff_advice}</p>
          </div>
        )}

        {/* Final Advice */}
        {submission.final_advice && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Key Advice</h2>
            </div>
            <p className="text-gray-900 text-lg whitespace-pre-wrap font-medium">
              "{submission.final_advice}"
            </p>
          </div>
        )}

        {/* Files */}
        {(submission.process_files?.length > 0 || 
          submission.template_files?.length > 0 || 
          submission.example_files?.length > 0) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Download className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Downloadable Resources</h2>
            </div>

            {submission.process_files && submission.process_files.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Process Documents</h3>
                <div className="space-y-2">
                  {submission.process_files.map(file => (
                    <button
                      key={file}
                      onClick={() => handleDownload('process-documents', file)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 text-sm">{file}</span>
                      </div>
                      <Download className="w-5 h-5 text-purple-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submission.template_files && submission.template_files.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Templates</h3>
                <div className="space-y-2">
                  {submission.template_files.map(file => (
                    <button
                      key={file}
                      onClick={() => handleDownload('templates', file)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 text-sm">{file}</span>
                      </div>
                      <Download className="w-5 h-5 text-purple-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submission.example_files && submission.example_files.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Work Examples</h3>
                <div className="space-y-2">
                  {submission.example_files.map(file => (
                    <button
                      key={file}
                      onClick={() => handleDownload('examples', file)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 text-sm">{file}</span>
                      </div>
                      <Download className="w-5 h-5 text-purple-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow-up */}
        {submission.allow_followup && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-900">
              <strong>Note:</strong> The contributor is open to follow-up questions. 
              Contact your admin to coordinate anonymous communication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourceDetail; 
