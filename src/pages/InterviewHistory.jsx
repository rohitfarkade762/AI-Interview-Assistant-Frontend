import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Clock, 
  Calendar, 
  Play, 
  Eye, 
  Download, 
  MessageSquare,
  Code,
  BarChart3,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';

const InterviewHistory = () => {
  const { user } = useUser();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchInterviewHistory();
  }, [user]);

  const fetchInterviewHistory = async () => {
    if (!user) return;

    try {
      const response = await fetch(`https://ai-interview-assistant-backend-f8ao.vercel.app/api/interviews/${user.id}`);
      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Error fetching interview history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const viewInterview = (interview) => {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  };

  const exportInterview = (interview) => {
    const dataStr = JSON.stringify(interview, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-${interview.id}-${new Date(interview.completedAt).toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview History</h1>
          <p className="text-gray-600">Review your past AI interview sessions and performance</p>
        </div>

        {interviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interviews Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't completed any AI interviews yet. Start your first interview to see results here.
            </p>
            <button
              onClick={() => window.location.href = '/interview-prep'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        AI Interview Session
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDuration(interview.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {interview.questions?.length || 0} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {interview.responses?.length || 0} responses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDate(interview.completedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Question Categories */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {interview.questions && [...new Set(interview.questions.map(q => q.category))].map((category, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Performance Indicators */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">
                          {Math.round((interview.responses?.length || 0) / (interview.questions?.length || 1) * 100)}% completion
                        </span>
                      </div>
                      
                      {interview.responses?.some(r => r.codeAnswer) && (
                        <div className="flex items-center gap-1">
                          <Code className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-600">Coding questions included</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => viewInterview(interview)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportInterview(interview)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Export Interview"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Interview Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Interview Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedInterview.questions?.length || 0}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedInterview.responses?.length || 0}</div>
                    <div className="text-sm text-gray-600">Responses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatDuration(selectedInterview.duration)}</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                </div>

                {/* Chat History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Interview Conversation</h3>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                    {selectedInterview.chatHistory?.map((message, index) => (
                      <div key={index} className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.sender === 'ai' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
                        }`}>
                          <p className="text-gray-900">{message.message}</p>
                          {message.code && (
                            <div className="mt-2 p-3 bg-gray-900 rounded text-green-400 text-sm font-mono">
                              <pre>{message.code}</pre>
                            </div>
                          )}
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Analysis */}
                {selectedInterview.responses && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Analysis</h3>
                    <div className="space-y-4">
                      {selectedInterview.responses.map((response, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <p className="text-sm text-gray-600 italic">{response.question}</p>
                          </div>
                          
                          {response.textAnswer && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Text Answer:</span>
                              <p className="text-sm text-gray-600 mt-1">{response.textAnswer}</p>
                            </div>
                          )}
                          
                          {response.codeAnswer && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Code Solution ({response.codeLanguage}):</span>
                              <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded mt-1 overflow-x-auto">
                                {response.codeAnswer}
                              </pre>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Response time: {Math.round(response.responseTime / 1000)}s
                          </div>
                        </div>
                      ))}
                    </div>
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

export default InterviewHistory;
