import React, { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Award,
  Briefcase,
  GraduationCap,
  Star,
  Download
} from 'lucide-react';

const ResumeAnalyzer = () => {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      setError('Please select a resume file');
      return;
    }

    if (!user) {
      setError('Please sign in to analyze your resume');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      console.log(user.id)
      formData.append('userId', user.id);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('http://localhost:5000/api/analyze-resume', {
        method: 'POST',
        body: formData,
        
      });
      console.log(response.body);

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing your resume');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Resume Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your resume and get AI-powered insights to improve your job prospects
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Resume
              </h2>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                
                {file ? (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop your resume here, or click to browse
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports PDF, DOC, DOCX, TXT (Max 10MB)
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="resume-upload"
                />
                
                <label
                  htmlFor="resume-upload"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              {/* Job Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get targeted feedback..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzeResume}
                disabled={loading || !file}
                className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-all ${
                  loading || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Resume...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5" />
                    Analyze with AI
                  </div>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Overall Score</h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(analysis.overallScore)} ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}/100
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full ${
                        analysis.overallScore >= 80 ? 'bg-green-500' :
                        analysis.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.overallScore}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-600">{analysis.summary}</p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Skills Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.skills.technical.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Soft Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.skills.soft.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience & Education */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Experience
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Total Experience</span>
                        <p className="font-medium">{analysis.experience.totalYears} years</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Recent Companies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.experience.companies.slice(0, 3).map((company, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{analysis.education.degree}</p>
                        <p className="text-sm text-gray-600">{analysis.education.field}</p>
                        <p className="text-sm text-gray-500">{analysis.education.institution}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recommendations
                  </h3>
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-900">{rec.category}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyword Match (if job description provided) */}
                {jobDescription && analysis.keywordMatch && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Job Match Score</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(analysis.keywordMatch.score)} ${getScoreColor(analysis.keywordMatch.score)}`}>
                        {analysis.keywordMatch.score}/100
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${analysis.keywordMatch.score}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {analysis.keywordMatch.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keywordMatch.missingKeywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Analyze Your Resume?
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload your resume to get AI-powered insights and recommendations
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Skill Analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    ATS Optimization
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Improvement Tips
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
