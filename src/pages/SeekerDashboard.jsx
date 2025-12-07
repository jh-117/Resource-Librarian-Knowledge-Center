import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Filter, BookOpen, LogOut, FileText, Users, Briefcase, Clock } from 'lucide-react';

function SeekerDashboard({ user, profile }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    department: '',
    positionLevel: '',
    experienceRange: '',
    teamSize: '',
    category: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 
                      'Customer Success', 'Operations', 'Finance', 'HR', 'Legal', 'Other'];
  const positionLevels = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'];
  const experienceRanges = ['<6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'];
  const teamSizes = ['Just me', '2-5', '6-10', '11-20', '20+'];

  useEffect(() => {
  fetchSubmissions();

  const channel = supabase
    .channel('knowledge_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'knowledge_submissions' },
      () => {
        // Just re-fetch whenever ANY change happens to this table
        fetchSubmissions();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, submissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.ai_summary?.toLowerCase().includes(query) ||
        sub.final_advice?.toLowerCase().includes(query) ||
        sub.department?.toLowerCase().includes(query) ||
        sub.ai_keywords?.some(keyword => keyword.toLowerCase().includes(query)) ||
        sub.main_responsibilities?.some(resp => resp.toLowerCase().includes(query))
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(sub => sub.department === filters.department);
    }

    // Position level filter
    if (filters.positionLevel) {
      filtered = filtered.filter(sub => sub.position_level === filters.positionLevel);
    }

    // Experience filter
    if (filters.experienceRange) {
      filtered = filtered.filter(sub => sub.experience_range === filters.experienceRange);
    }

    // Team size filter
    if (filters.teamSize) {
      filtered = filtered.filter(sub => sub.team_size_range === filters.teamSize);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(sub => 
        sub.ai_category?.includes(filters.category)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      positionLevel: '',
      experienceRange: '',
      teamSize: '',
      category: ''
    });
    setSearchQuery('');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              <BookOpen className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Knowledge Library</h1>
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
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for processes, skills, advice, tools..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-6 py-3 border rounded-lg font-medium ${
                showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position Level
                  </label>
                  <select
                    value={filters.positionLevel}
                    onChange={(e) => setFilters({ ...filters, positionLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Levels</option>
                    {positionLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <select
                    value={filters.experienceRange}
                    onChange={(e) => setFilters({ ...filters, experienceRange: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Experience</option>
                    {experienceRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size
                  </label>
                  <select
                    value={filters.teamSize}
                    onChange={(e) => setFilters({ ...filters, teamSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Sizes</option>
                    {teamSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Processes">Processes</option>
                    <option value="Skills">Skills</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Templates">Templates</option>
                    <option value="Advice">Advice</option>
                    <option value="Tools">Tools</option>
                    <option value="Problem-Solving">Problem-Solving</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'Result' : 'Results'}
          </h2>
          {(searchQuery || Object.values(filters).some(f => f)) && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Grid */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map(submission => (
              <div
                key={submission.id}
                onClick={() => navigate(`/resource/${submission.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {submission.department}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{submission.position_level}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{submission.experience_range}</span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {submission.ai_summary && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {submission.ai_summary}
                  </p>
                )}

                {/* Categories */}
                {submission.ai_category && submission.ai_category.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {submission.ai_category.slice(0, 3).map(cat => (
                      <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {cat}
                      </span>
                    ))}
                    {submission.ai_category.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{submission.ai_category.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Keywords */}
                {submission.ai_keywords && submission.ai_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {submission.ai_keywords.slice(0, 4).map(keyword => (
                      <span key={keyword} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {submission.team_size_range && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{submission.team_size_range}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeekerDashboard; 
