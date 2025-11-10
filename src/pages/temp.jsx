import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Target, 
  CheckCircle2, 
  Brain, 
  MessageSquare, 
  Clock,
  Star,
  TrendingUp,
  BookOpen,
  Mic,
  Users,
  Award,
  ChevronRight,
  RefreshCw,
  Play,
  FileText,
  Lightbulb,
  Search,
  Filter,
  Download,
  MessageCircle,
  Code,
  User
} from 'lucide-react';

const InterviewPrep = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [analyses, setAnalyses] = useState([]);
  const [allSkills, setAllSkills] = useState({ technical: [], soft: [] });
  const [selectedSkills, setSelectedSkills] = useState({ technical: [], soft: [] });
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  useEffect(() => {
    fetchAnalysesAndExtractSkills();
  }, [user]);

  const fetchAnalysesAndExtractSkills = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:5000/api/analyses/${user.id}`);
      const data = await response.json();
      
      setAnalyses(data.analyses || []);
      
      const technicalSkills = new Set();
      const softSkills = new Set();
      
      data.analyses?.forEach(analysis => {
        if (analysis.analysis?.skills) {
          analysis.analysis.skills.technical?.forEach(skill => technicalSkills.add(skill));
          analysis.analysis.skills.soft?.forEach(skill => softSkills.add(skill));
        }
      });

      setAllSkills({
        technical: Array.from(technicalSkills),
        soft: Array.from(softSkills)
      });
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill, type) => {
    setSelectedSkills(prev => ({
      ...prev,
      [type]: prev[type].includes(skill) 
        ? prev[type].filter(s => s !== skill)
        : [...prev[type], skill]
    }));
  };

  


  const generateInterviewQuestions = async () => {
    const totalSelected = selectedSkills.technical.length + selectedSkills.soft.length;
    if (totalSelected === 0) {
      alert('Please select at least one skill to generate interview questions.');
      return;
    }
  
    setGeneratingQuestions(true);
    
    try {
      // Step 1: Create session first
      const sessionResponse = await fetch('http://localhost:5000/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
        }),
      });
  
      if (!sessionResponse.ok) {
        throw new Error(`Failed to start interview: ${sessionResponse.status}`);
      }
  
      const { sessionId } = await sessionResponse.json();
      console.log("✅ Session ID:", sessionId);
  
      // Step 2: Generate questions with the session ID
      const questionsResponse = await fetch('http://localhost:5000/api/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          session_Id: sessionId,  // ✅ Now accessible
          skills: selectedSkills
        }),
      });
  
      if (!questionsResponse.ok) {
        throw new Error(`Failed to generate questions: ${questionsResponse.status}`);
      }
      
      const data = await questionsResponse.json();
      setInterviewQuestions(data.questions || []);
      setSessionId(sessionId);  // Store the session ID in state
      setShowQuestions(true);
  
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  
  

  const startVoiceInterview = async () => {
   
  
      navigate('/ai/interview-section', {
        state: {
          questions: interviewQuestions,
          selectedSkills,
          session : sessionId,
          userId: user?.id || null,
        },
      });
  
      console.log("Interview Questions:", interviewQuestions);
      
  
    
  };
  

  const getFilteredSkills = () => {
    let skills = [];
    
    if (skillFilter === 'all' || skillFilter === 'technical') {
      skills.push(...allSkills.technical.map(skill => ({ skill, type: 'technical' })));
    }
    if (skillFilter === 'all' || skillFilter === 'soft') {
      skills.push(...allSkills.soft.map(skill => ({ skill, type: 'soft' })));
    }

    if (skillSearch) {
      skills = skills.filter(item => 
        item.skill.toLowerCase().includes(skillSearch.toLowerCase())
      );
    }

    return skills;
  };

  const getSkillFrequency = (skill) => {
    return analyses.reduce((count, analysis) => {
      const skills = [
        ...(analysis.analysis?.skills?.technical || []),
        ...(analysis.analysis?.skills?.soft || [])
      ];
      return skills.includes(skill) ? count + 1 : count;
    }, 0);
  };

  const exportInterviewPrep = () => {
    const content = {
      selectedSkills,
      questions: interviewQuestions,
      generatedAt: new Date().toISOString(),
      user: user.firstName + ' ' + user.lastName
    };
    
    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-prep-${new Date().toISOString().split('T')[0]}.json`;
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

  const totalSkills = allSkills.technical.length + allSkills.soft.length;
  const totalSelected = selectedSkills.technical.length + selectedSkills.soft.length;
  const filteredSkills = getFilteredSkills();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Preparation</h1>
          <p className="text-gray-600">Select skills from your resume history to generate targeted interview questions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Skills Found</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalSkills}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Skills Selected</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalSelected}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resumes Analyzed</p>
                <h3 className="text-2xl font-bold text-gray-900">{analyses.length}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions Generated</p>
                <h3 className="text-2xl font-bold text-gray-900">{interviewQuestions.length}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Selection Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Select Skills for Interview Prep</h2>
                <button
                  onClick={fetchAnalysesAndExtractSkills}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Skills</option>
                    <option value="technical">Technical Skills</option>
                    <option value="soft">Soft Skills</option>
                  </select>
                </div>
              </div>

              {/* Skills Grid */}
              {filteredSkills.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Found</h3>
                  <p className="text-gray-600">
                    {totalSkills === 0 
                      ? 'Analyze some resumes first to extract skills for interview preparation.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSkills.map(({ skill, type }, index) => {
                    const isSelected = selectedSkills[type].includes(skill);
                    const frequency = getSkillFrequency(skill);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => toggleSkill(skill, type)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          isSelected 
                            ? type === 'technical'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckCircle2 className={`w-4 h-4 ${type === 'technical' ? 'text-blue-600' : 'text-green-600'}`} />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              type === 'technical' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {type === 'technical' ? 'Tech' : 'Soft'}
                            </span>
                          </div>
                          {frequency > 1 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-500">{frequency}</span>
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{skill}</p>
                        {frequency > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Found in {frequency} resume{frequency > 1 ? 's' : ''}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Generate Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={generateInterviewQuestions}
                  disabled={generatingQuestions || totalSelected === 0}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                    generatingQuestions || totalSelected === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {generatingQuestions ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating Interview Questions...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" />
                      Generate Interview Questions ({totalSelected} skills selected)
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Selected Skills Summary & Quick Actions */}
          <div className="space-y-6">
            {/* Selected Skills Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Selected Skills Summary</h3>
              
              {totalSelected === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No skills selected yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSkills.technical.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Technical Skills ({selectedSkills.technical.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedSkills.technical.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSkills.soft.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Soft Skills ({selectedSkills.soft.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedSkills.soft.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setSelectedSkills({
                      technical: allSkills.technical.slice(0, 5),
                      soft: allSkills.soft.slice(0, 3)
                    });
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">Select Top Skills</span>
                </button>
                
                <button 
                  onClick={() => setSelectedSkills({ technical: [], soft: [] })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">Clear All</span>
                </button>

                {interviewQuestions.length > 0 && (
                  <button 
                    onClick={exportInterviewPrep}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Export Prep</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interview Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Interview Tips</h3>
              <div className="space-y-2 text-sm text-purple-800">
                <p>• Practice the STAR method (Situation, Task, Action, Result)</p>
                <p>• Prepare specific examples for each skill</p>
                <p>• Research the company and role beforehand</p>
                <p>• Have questions ready to ask the interviewer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Questions Section */}
        {showQuestions && interviewQuestions.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Generated Interview Questions</h2>
                <button
                  onClick={() => setShowQuestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {interviewQuestions.map((category, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      {category.category}
                    </h3>
                    <div className="space-y-3">
                      {category.questions.map((question, qIndex) => (
                        <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                          <p className="text-sm text-gray-600">{question.tip}</p>
                          {question.skills && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {question.skills.map((skill, sIndex) => (
                                  <span key={sIndex} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
               

                <button 
                  onClick={startVoiceInterview}
                  className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
                >
                  <Mic className="w-5 h-5" />
                  Start Voice Interview
                </button>

                <button 
                  onClick={() => setShowQuestions(false)}
                  className="flex items-center gap-2 px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPrep;
