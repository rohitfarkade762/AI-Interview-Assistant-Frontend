
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { X } from "lucide-react"
import { 
  FileText, 
  Calendar, 
  Star, 
  Eye, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Clock,
  TrendingUp,
  BarChart3,
  FileSearch,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

const ResumeHistory = () => {
  const { user } = useUser();
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch user's resume analyses
  const fetchAnalyses = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/analyses/${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
      setFilteredAnalyses(data.analyses || []);
    } catch (err) {
      setError(err.message || 'Failed to load resume analyses');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort analyses
  useEffect(() => {
    let filtered = analyses.filter(analysis => {
      const matchesSearch = analysis.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (analysis.analysis?.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterScore !== 'all') {
        const score = analysis.analysis?.overallScore || 0;
        switch (filterScore) {
          case 'excellent':
            matchesFilter = score >= 90;
            break;
          case 'good':
            matchesFilter = score >= 70 && score < 90;
            break;
          case 'average':
            matchesFilter = score >= 50 && score < 70;
            break;
          case 'poor':
            matchesFilter = score < 50;
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });

    // Sort analyses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'score-high':
          return (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0);
        case 'score-low':
          return (a.analysis?.overallScore || 0) - (b.analysis?.overallScore || 0);
        case 'filename':
          return a.filename.localeCompare(b.filename);
        default:
          return 0;
      }
    });

    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, filterScore, sortBy]);

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  // Get score color and badge
  const getScoreColor = (score) => {
    if (score >= 90) return { color: 'text-green-600', bg: 'bg-green-100', badge: 'Excellent' };
    if (score >= 70) return { color: 'text-blue-600', bg: 'bg-blue-100', badge: 'Good' };
    if (score >= 50) return { color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'Average' };
    return { color: 'text-red-600', bg: 'bg-red-100', badge: 'Needs Work' };
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // View analysis details
  const viewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowDetailModal(true);
  };

  // Delete analysis
  const deleteAnalysis = async (analysisId) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/analysis/${analysisId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      } else {
        throw new Error('Failed to delete analysis');
      }
    } catch (err) {
      alert('Error deleting analysis: ' + err.message);
    }
  };

  // Export analysis as JSON
  const exportAnalysis = (analysis) => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-analysis-${analysis.filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Statistics
  const getStats = () => {
    if (analyses.length === 0) return { total: 0, avgScore: 0, excellent: 0, good: 0 };

    const total = analyses.length;
    const scores = analyses.map(a => a.analysis?.overallScore || 0);
    const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / total);
    const excellent = analyses.filter(a => (a.analysis?.overallScore || 0) >= 90).length;
    const good = analyses.filter(a => (a.analysis?.overallScore || 0) >= 70).length;

    return { total, avgScore, excellent, good };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis History</h1>
              <p className="text-gray-600">View and manage all your analyzed resumes</p>
            </div>
            <button
              onClick={fetchAnalyses}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Analyses</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.avgScore}/100</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Excellent Scores</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.excellent}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Good+ Scores</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.good}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by filename or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Score Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Scores</option>
                  <option value="excellent">Excellent (90+)</option>
                  <option value="good">Good (70-89)</option>
                  <option value="average">Average (50-69)</option>
                  <option value="poor">Needs Work (&lt;50)</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score-high">Highest Score</option>
                <option value="score-low">Lowest Score</option>
                <option value="filename">Filename A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Analysis List */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterScore !== 'all' ? 'No matching analyses found' : 'No resume analyses yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterScore !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by analyzing your first resume to see results here'
              }
            </p>
            {(!searchTerm && filterScore === 'all') && (
              <button
                onClick={() => window.location.href = '/resume-analyzer'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyze Resume
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => {
              const scoreData = getScoreColor(analysis.analysis?.overallScore || 0);
              
              return (
                <div key={analysis.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">{analysis.filename}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${scoreData.bg} ${scoreData.color}`}>
                          {analysis.analysis?.overallScore || 0}/100
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${scoreData.bg} ${scoreData.color}`}>
                          {scoreData.badge}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {analysis.analysis?.summary || 'No summary available'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(analysis.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {analysis.analysis?.strengths?.length || 0} strengths
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {analysis.analysis?.recommendations?.length || 0} recommendations
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Overall Score</span>
                          <span className="text-sm text-gray-500">{analysis.analysis?.overallScore || 0}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (analysis.analysis?.overallScore || 0) >= 90 ? 'bg-green-500' :
                              (analysis.analysis?.overallScore || 0) >= 70 ? 'bg-blue-500' :
                              (analysis.analysis?.overallScore || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.analysis?.overallScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => viewAnalysis(analysis)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportAnalysis(analysis)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Export Analysis"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAnalysis(analysis.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Analysis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        

        {/* Detail Modal */}
        {showDetailModal && selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAnalysis.filename}</h2>
                    <p className="text-gray-500">Analyzed on {formatDate(selectedAnalysis.created_at)}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {selectedAnalysis.analysis ? (
                  <div className="space-y-6">
                    {/* Score Overview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Overall Assessment</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedAnalysis.analysis.overallScore).bg} ${getScoreColor(selectedAnalysis.analysis.overallScore).color}`}>
                          {selectedAnalysis.analysis.overallScore}/100
                        </div>
                      </div>
                      <p className="text-gray-700">{selectedAnalysis.analysis.summary}</p>
                    </div>

                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(selectedAnalysis.analysis.strengths || []).map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-5 h-5" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {(selectedAnalysis.analysis.weaknesses || []).map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Skills */}
                    {selectedAnalysis.analysis.skills && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Skills Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Technical Skills</h5>
                            <div className="flex flex-wrap gap-2">
                              {(selectedAnalysis.analysis.skills.technical || []).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Soft Skills</h5>
                            <div className="flex flex-wrap gap-2">
                              {(selectedAnalysis.analysis.skills.soft || []).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedAnalysis.analysis.recommendations && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Recommendations</h4>
                        <div className="space-y-3">
                          {(selectedAnalysis.analysis.recommendations || []).map((rec, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                              <h5 className="font-medium text-blue-900">{rec.category}</h5>
                              <p className="text-blue-800 text-sm mt-1">{rec.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No analysis data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeHistory;
