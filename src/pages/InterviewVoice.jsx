import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Code, Maximize2, Minimize2, ChevronDown, Play, Loader } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function VoiceAssistantWithEditor() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [formattedQuestions, setFormattedQuestions] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [code, setCode] = useState("// Write your code here...");
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState("");
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const conversationRef = useRef([]);
  const [conversation, setConversation] = useState([]);
  const currentQuestionRef = useRef(0);
  const questionNumberRef = useRef(1);

  const location = useLocation();

  const categories = location.state?.questions || [];
  const userId = location.state?.userId || [];
  const session = location.state?.session || [];

  // Language configurations
  const languages = {
    javascript: {
      name: "JavaScript",
      extension: ".js",
      template: "// Write your JavaScript code here...\nconsole.log('Hello World');",
      color: "text-yellow-400",
      judge0Id: 63
    },
    python: {
      name: "Python",
      extension: ".py",
      template: "# Write your Python code here...\nprint('Hello World')",
      color: "text-blue-400",
      judge0Id: 71
    },
    java: {
      name: "Java",
      extension: ".java",
      template: "// Write your Java code here...\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}",
      color: "text-orange-400",
      judge0Id: 62
    },
    cpp: {
      name: "C++",
      extension: ".cpp",
      template: "// Write your C++ code here...\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World\" << endl;\n    return 0;\n}",
      color: "text-blue-300",
      judge0Id: 54
    },
    c: {
      name: "C",
      extension: ".c",
      template: "// Write your C code here...\n#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}",
      color: "text-blue-500",
      judge0Id: 50
    },
    typescript: {
      name: "TypeScript",
      extension: ".ts",
      template: "// Write your TypeScript code here...\nconsole.log('Hello World');",
      color: "text-blue-600",
      judge0Id: 74
    },
    go: {
      name: "Go",
      extension: ".go",
      template: "// Write your Go code here...\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello World\")\n}",
      color: "text-cyan-400",
      judge0Id: 60
    },
    rust: {
      name: "Rust",
      extension: ".rs",
      template: "// Write your Rust code here...\nfn main() {\n    println!(\"Hello World\");\n}",
      color: "text-orange-500",
      judge0Id: 73
    },
    ruby: {
      name: "Ruby",
      extension: ".rb",
      template: "# Write your Ruby code here...\nputs 'Hello World'",
      color: "text-red-400",
      judge0Id: 72
    },
    php: {
      name: "PHP",
      extension: ".php",
      template: "<?php\n// Write your PHP code here...\necho \"Hello World\\n\";\n?>",
      color: "text-purple-400",
      judge0Id: 68
    },
    swift: {
      name: "Swift",
      extension: ".swift",
      template: "// Write your Swift code here...\nprint(\"Hello World\")",
      color: "text-orange-600",
      judge0Id: 83
    },
    kotlin: {
      name: "Kotlin",
      extension: ".kt",
      template: "// Write your Kotlin code here...\nfun main() {\n    println(\"Hello World\")\n}",
      color: "text-purple-500",
      judge0Id: 78
    }
  };

  const questions = React.useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];

    const result = categories.flatMap(category => {
      if (!category?.questions || !Array.isArray(category.questions)) return [];

      return category.questions.map(q => ({
        question: q.question || '',
        category: category.category || 'General',
        tip: q.tip || '',
        skills: q.skills || [],
      }));
    });

    return result;
  }, [categories]);

  // Update code template when language changes
  useEffect(() => {
    setCode(languages[selectedLanguage].template);
    setOutput("");
  }, [selectedLanguage]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");
  
    try {
      const languageMap = {
        javascript: 'javascript',
        python: 'python',
        java: 'java',
        cpp: 'c++',
        c: 'c',
        go: 'go',
        rust: 'rust',
        ruby: 'ruby',
        php: 'php',
      };
  
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: languageMap[selectedLanguage] || selectedLanguage,
          version: '*',
          files: [{
            content: code
          }],
          stdin: input
        })
      });
  
      const result = await response.json();
  
      if (result.run.output) {
        setOutput(result.run.output);
      } else if (result.run.stderr) {
        setOutput(`Error:\n${result.run.stderr}`);
      } else {
        setOutput("Program executed successfully with no output.");
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runJavaScriptLocally = () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      eval(code);

      console.log = originalLog;

      setOutput(logs.length > 0 ? logs.join('\n') : "Program executed successfully with no output.");
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCode = () => {
    if (selectedLanguage === 'javascript') {
      runJavaScriptLocally();
    } else {
      runCode();
    }
  };

  const speakResponse = useCallback((text) => {
    return new Promise((resolve) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === "Google UK English Female");
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, []);

  const handleUserAnswer = useCallback(async (userInput) => {
    if (!isInterviewMode) return;
    
    try {
      const currentQuestion = formattedQuestions[currentQuestionRef.current];
      const currentQNumber = questionNumberRef.current;
      
      const res = await fetch("http://localhost:5000/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          questionContext: currentQuestion?.question || "",
          code : code,
          questionNumber: currentQNumber,
          session: session,
        }),
      });
  
      const data = await res.json();
      const aiResponse = data.reply || "Sorry, I couldn't understand that right now.";
  
      const aiMessage = {
        role: "assistant",
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
  
      setConversation((prev) => [...prev, aiMessage]);
      conversationRef.current = [...conversationRef.current, aiMessage];
      await speakResponse(aiResponse);
  
      currentQuestionRef.current += 1;
      questionNumberRef.current += 1;
      
      const nextIndex = currentQuestionRef.current;
      setCurrentQuestionIndex(nextIndex);
      setQuestionNumber(questionNumberRef.current);
  
      setTimeout(() => {
        if (nextIndex < formattedQuestions.length) {
          const nextQuestion = formattedQuestions[nextIndex];
          const questionText = `${nextQuestion.category}: ${nextQuestion.question}`;
          const nextMsg = {
            role: "assistant",
            text: questionText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setConversation((prev) => [...prev, nextMsg]);
          conversationRef.current = [...conversationRef.current, nextMsg];
          setResponse(questionText);
          speakResponse(questionText);
        } else {
          const endText = "That concludes our interview. Great job!";
          const endMsg = {
            role: "assistant",
            text: endText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setConversation((prev) => [...prev, endMsg]);
          conversationRef.current = [...conversationRef.current, endMsg];
          setResponse(endText);
          speakResponse(endText);
          setIsInterviewMode(false);
          setIsInterviewStarted(false);
        }
      }, 1500);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, [formattedQuestions, isInterviewMode, speakResponse, session]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognitionRef.current.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);

        const userMessage = {
          role: "user",
          text: speechResult,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setConversation(prev => [...prev, userMessage]);
        conversationRef.current = [...conversationRef.current, userMessage];

        setIsProcessing(true);
        await handleUserAnswer(speechResult);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };
    }
  }, [handleUserAnswer]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const startInterview = () => {
    if (!questions || questions.length === 0) {
      alert("No questions available! Please generate questions first.");
      return;
    }

    setFormattedQuestions(questions);
    setCurrentQuestionIndex(0);
    setQuestionNumber(1);
    currentQuestionRef.current = 0;
    questionNumberRef.current = 1;
    
    setIsInterviewStarted(true);
    setIsInterviewMode(true);
    setConversation([]);
    conversationRef.current = [];

    const startMsg = {
      role: "assistant",
      text: "Let's start your interview! Here's your first question:",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const firstQuestionMsg = {
      role: "assistant",
      text: `${questions[0].category}: ${questions[0].question}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setConversation([startMsg, firstQuestionMsg]);
    conversationRef.current = [startMsg, firstQuestionMsg];
    setResponse(firstQuestionMsg.text);

    setTimeout(() => {
      speakResponse(`Let's start your interview! Here's your first question: ${questions[0].question}`);
    }, 500);
  };

  const startListening = () => recognitionRef.current?.start();
  const stopListening = () => recognitionRef.current?.stop();

  const clearConversation = () => {
    window.speechSynthesis.cancel();
    setTranscript("");
    setResponse("");
    setConversation([]);
    conversationRef.current = [];
    setCurrentQuestionIndex(0);
    setQuestionNumber(1);
    currentQuestionRef.current = 0;
    questionNumberRef.current = 1;
    setIsInterviewMode(false);
    setIsInterviewStarted(false);
    setFormattedQuestions([]);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${languages[selectedLanguage].extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 p-4">
      <div className="h-screen max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Side - Voice Assistant */}
        <div className={`bg-white rounded-2xl shadow-2xl p-6 flex flex-col min-h-0 ${isEditorExpanded ? 'hidden lg:flex' : ''}`}>
          <div className="text-center mb-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">AI Interview Assistant</h1>
            <p className="text-gray-500 text-sm">Click start to begin your interview</p>
            {isInterviewStarted && formattedQuestions.length > 0 && (
              <p className="text-blue-600 text-sm mt-2 font-semibold">
                Question {Math.min(currentQuestionIndex + 1, formattedQuestions.length)} of {formattedQuestions.length}
              </p>
            )}
          </div>

          <div className="flex justify-center items-center mb-4 flex-shrink-0">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isListening
                  ? "bg-red-500 animate-pulse"
                  : isSpeaking
                  ? "bg-green-500 animate-pulse"
                  : isProcessing
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-gray-300"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isListening
                ? "Listening..."
                : isSpeaking
                ? "Speaking..."
                : isProcessing
                ? "Processing..."
                : "Ready"}
            </span>
          </div>

          {!isInterviewStarted ? (
            <button
              onClick={startInterview}
              className="mb-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex-shrink-0"
            >
              🚀 Start Interview
            </button>
          ) : (
            <div className="flex justify-center mb-4 flex-shrink-0">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={isSpeaking || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic size={36} />
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-6 shadow-lg hover:shadow-xl animate-pulse transition-all"
                >
                  <Square size={36} />
                </button>
              )}
            </div>
          )}

          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 overflow-y-auto min-h-0">
            <div className="flex flex-col">
              {conversation.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">
                  No messages yet. Click "Start Interview" to begin.
                </p>
              ) : (
                conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm transition-all duration-300 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="block text-[10px] text-gray-400 mt-1 text-right">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef}></div>
            </div>
          </div>

          {conversation.length > 0 && (
            <button
              onClick={clearConversation}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition flex-shrink-0"
            >
              Clear Conversation
            </button>
          )}
        </div>

        {/* Right Side - Code Editor */}
        <div className={`bg-white rounded-2xl shadow-2xl p-6 flex flex-col min-h-0 ${isEditorExpanded ? 'lg:col-span-2' : ''}`}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Code className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Code Editor</h2>
              
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.entries(languages).map(([key, lang]) => (
                    <option key={key} value={key}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" size={16} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? <Loader className="animate-spin" size={18} /> : <Play size={18} />}
                <span className="ml-1">{isRunning ? "Running" : "Run"}</span>
              </button>
              <button
                onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                className="lg:block hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {isEditorExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Code Editor */}
            <div className="relative flex-1 mb-2 min-h-0">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm bg-gray-900 ${languages[selectedLanguage].color} rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none resize-none`}
                placeholder={languages[selectedLanguage].template}
                spellCheck="false"
              />
              
              {/* Language Badge */}
              <div className="absolute top-2 right-2 bg-gray-800 px-3 py-1 rounded-full">
                <span className={`text-xs font-semibold ${languages[selectedLanguage].color}`}>
                  {languages[selectedLanguage].name}
                </span>
              </div>
            </div>

            {/* Input Section */}
            <div className="mb-2 flex-shrink-0">
              <label className="text-xs text-gray-600 mb-1 block">Input (stdin):</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-16 p-2 font-mono text-xs bg-gray-100 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Enter input here..."
              />
            </div>

            {/* Output Section */}
            <div className="mb-4 flex-shrink-0">
              <label className="text-xs text-gray-600 mb-1 block">Output:</label>
              <div className="w-full h-32 p-3 font-mono text-xs bg-black text-green-400 rounded-lg overflow-y-auto whitespace-pre-wrap border-2 border-gray-700">
                {output || "Output will appear here..."}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 flex-shrink-0">
              <button
                onClick={() => setCode(languages[selectedLanguage].template)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert("Code copied to clipboard!");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Copy
              </button>
              <button
                onClick={downloadCode}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}