import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function VoiceAssistant() {
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
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const conversationRef = useRef([]);
  const [conversation, setConversation] = useState([]);
  const currentQuestionRef = useRef(0);
  const questionNumberRef = useRef(1);

  const location = useLocation();

  // Read questions from location.state
  const categories = location.state?.questions || [];
  const userId = location.state?.userId || [];
  const session = location.state?.session || [];
  console.log(userId)
   console.log(session)
  // Flatten nested questions
  const questions = React.useMemo(() => {
    console.log("Processing categories:", categories);

    if (!categories || !Array.isArray(categories)) return [];

    const result = categories.flatMap(category => {
      console.log("Processing category:", category);

      if (!category?.questions || !Array.isArray(category.questions)) return [];

      return category.questions.map(q => ({
        question: q.question || '',
        category: category.category || 'General',
        tip: q.tip || '',
        skills: q.skills || [],
      }));
    });

    console.log("Final questions array:", result);
    return result;
  }, [categories]);

  console.log("Questions to use:", questions);

  // TTS - MOVED BEFORE handleUserAnswer
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

  // Handle user answer - MOVED BEFORE useEffect
  const handleUserAnswer = useCallback(async (userInput) => {
    if (!isInterviewMode) return;
    
    try {
      const currentQuestion = formattedQuestions[currentQuestionRef.current];
      const currentQNumber = questionNumberRef.current;
      
      console.log("Sending - Question Number:", currentQNumber, "Question:", currentQuestion?.question);
      
      const res = await fetch("https://ai-interview-assistant-backend-f8ao.vercel.app/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          questionContext: currentQuestion?.question || "",
          questionNumber: currentQNumber,
          session: session,
        }),
      });
  
      const data = await res.json();
      const aiResponse =
        data.reply || "Sorry, I couldn't understand that right now.";
  
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
        console.log("Next question index:", nextIndex);
        
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

  // Speech Recognition setup - NOW AFTER handleUserAnswer
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  // Scroll chat
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">AI Interview Assistant</h1>
          <p className="text-gray-500 text-sm">Click start to begin your interview</p>
          {isInterviewStarted && formattedQuestions.length > 0 && (
            <p className="text-blue-600 text-sm mt-2 font-semibold">
              Question {Math.min(currentQuestionIndex + 1, formattedQuestions.length)} of {formattedQuestions.length}
            </p>
          )}
        </div>

        <div className="flex justify-center items-center mb-6">
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

        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p>Debug: Questions found: {questions?.length || 0}</p>
          <p>Current Question: {currentQuestionIndex + 1}</p>
        </div>

        {!isInterviewStarted ? (
          <button
            onClick={startInterview}
            className="mb-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            🚀 Start Interview
          </button>
        ) : (
          <div className="flex justify-center mb-6">
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

        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 overflow-y-auto max-h-80">
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

        {conversation.length > 0 && (
          <button
            onClick={clearConversation}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition"
          >
            Clear Conversation
          </button>
        )}
      </div>
    </div>
  );
}