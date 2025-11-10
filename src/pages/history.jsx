import React, { useState, useEffect } from 'react';
import { User, Calendar, Target, CheckCircle, Clock, Bot, ArrowLeft, Award, MessageSquare, X } from 'lucide-react';

export default function AllInterviewSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    const getUserId = () => {
      if (window.Clerk && window.Clerk.user) {
        return window.Clerk.user.id;
      }
      
      try {
        const clerkSession = localStorage.getItem('clerk-session');
        if (clerkSession) {
          const parsed = JSON.parse(clerkSession);
          return parsed?.userId || '';
        }
      } catch (e) {
        console.error('Error reading Clerk session:', e);
      }
      
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('clerk') && name.includes('user')) {
          try {
            const decoded = decodeURIComponent(value);
            const parsed = JSON.parse(decoded);
            if (parsed.id) return parsed.id;
          } catch (e) {
            console.error('Error parsing cookie:', e);
          }
        }
      }
      
      return '';
    };

    const id = getUserId();
    setUserId(id);
    
    if (id) {
      fetchUserSessions(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserSessions = async (userId) => {
    try {
      const response = await fetch(`https://ai-interview-assistant-backend-f8ao.vercel.app/api/interview/sessions?user_id=${userId}`);
      const data = await response.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setLoading(false);
    }
  };

  const fetchSessionResponses = async (sessionId) => {
    setLoadingResponses(true);
    try {
      const response = await fetch(`https://ai-interview-assistant-backend-f8ao.vercel.app/api/interview/session/${sessionId}/responses`);
      const data = await response.json();
      
      const sortedResponses = (data.responses || []).sort((a, b) => 
        a.question_number - b.question_number
      );
      setResponses(sortedResponses);
      setLoadingResponses(false);
    } catch (error) {
      console.error("Error fetching responses:", error);
      setLoadingResponses(false);
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    fetchSessionResponses(session.id);
  };

  const handleBack = () => {
    setSelectedSession(null);
    setResponses([]);
  };

  const getSkillsDisplay = (selectedSkills) => {
    if (!selectedSkills) return [];
    
    try {
      const skills = typeof selectedSkills === 'string' 
        ? JSON.parse(selectedSkills) 
        : selectedSkills;
      
      const softSkills = skills?.soft || [];
      const technicalSkills = skills?.technical || [];
      return [...softSkills, ...technicalSkills];
    } catch (e) {
      return [];
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading your sessions...</div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-md">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please sign in to view your interview sessions</p>
        </div>
      </div>
    );
  }

  // Detail View
  if (selectedSession) {
    const skills = getSkillsDisplay(selectedSession.selected_skills);
    const percentage = selectedSession.max_marks > 0 
      ? ((selectedSession.total_marks / selectedSession.max_marks) * 100).toFixed(0)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Sessions</span>
          </button>

          {/* Session Summary Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Interview Session</h1>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                selectedSession.status === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedSession.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedSession.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Award size={24} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Score</div>
                  <div className="font-semibold text-gray-800">
                    {selectedSession.total_marks || 0}/{selectedSession.max_marks || 100} ({percentage}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Target size={24} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Questions Answered</div>
                  <div className="font-semibold text-gray-800">
                    {responses.length}
                  </div>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Skills Assessed</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Interview Conversation</h2>

            {loadingResponses ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading conversation...</div>
              </div>
            ) : responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((response, index) => (
                  <div key={response.id || index}>
                    {/* AI Question */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Bot size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-blue-600 font-semibold">AI Interviewer</div>
                            <div className="text-xs text-gray-400">Question {response.question_number}</div>
                          </div>
                          <div className="text-gray-800 whitespace-pre-wrap">{response.question}</div>
                        </div>
                      </div>
                    </div>

                    {/* User Response */}
                    <div className="flex gap-4 mb-4 ml-8">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-green-600 font-semibold">Your Response</div>
                            {response.marks !== undefined && response.marks !== null && (
                              <div className="text-xs font-semibold">
                                Score: <span className="text-blue-600">{response.marks}/10</span>
                              </div>
                            )}
                          </div>
                          <div className="text-gray-800 whitespace-pre-wrap">
                            {response.user_answer || 'No response provided'}
                          </div>
                        </div>
                        {response.created_at && (
                          <div className="text-xs text-gray-400 mt-1 ml-1">
                            {new Date(response.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {response.feedback && (
                      <div className="flex gap-4 mb-6 ml-16">
                        <div className="flex-1">
                          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                            <div className="text-xs text-purple-600 font-semibold mb-2">AI Feedback</div>
                            <div className="text-gray-700 text-sm whitespace-pre-wrap">{response.feedback}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {index < responses.length - 1 && (
                      <div className="border-t border-gray-200 my-6"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No conversation history available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sessions List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Interview Sessions</h1>
          <p className="text-gray-600">Track and review your interview performance</p>
        </div>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const skills = getSkillsDisplay(session.selected_skills);
              const percentage = session.max_marks > 0 
                ? ((session.total_marks / session.max_marks) * 100).toFixed(0)
                : 0;
              
              return (
                <div 
                  key={session.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <User size={20} />
                        <span className="font-medium">Interview Session</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'completed' 
                          ? 'bg-green-400 bg-opacity-30' 
                          : 'bg-yellow-400 bg-opacity-30'
                      }`}>
                        {session.status === 'completed' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            In Progress
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                      <Calendar size={16} />
                      <span>{new Date(session.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills Assessed</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.length > 0 ? (
                          skills.slice(0, 3).map((skill, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No skills specified</span>
                        )}
                        {skills.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Questions</div>
                        <div className="text-2xl font-bold text-gray-800">
                          {session.response_count || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Score</div>
                        <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Performance</span>
                        <span>{session.total_marks || 0}/{session.max_marks || 100}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => handleViewDetails(session)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Target size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No sessions found</h3>
            <p className="text-gray-500">Start your first interview session to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}