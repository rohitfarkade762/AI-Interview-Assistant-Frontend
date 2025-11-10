import './App.css';
import {Routes, Route} from "react-router-dom";
import Home from "./pages/Home"; 
import Layout from "./pages/Layout";

import Dashboard from "./pages/Dashboard";

import Interview from "./pages/Interview"


import ReviewResume from "./pages/ReviewResume"

import LiveInterviewInterface from './pages/temp';
import VoiceAssistant from './pages/assistent';
import History  from "./pages/history";
import Interviewvoice from "./pages/InterviewVoice"

import InterviewHistory from './pages/InterviewHistory';

function App() {
  return (
   <>
   <Routes>
    <Route path = "/" element = {<Home />}/>
    <Route path = "/ai" element = {<Layout />}>
      <Route index element = {<Dashboard />}/>
     
     
      <Route path = "Skills" element = {<LiveInterviewInterface />}/>
     
   
      <Route path = "review-resume" element = {<ReviewResume />}/>
      <Route path = "interview-section" element = {<Interviewvoice />}/>
      <Route path = "History" element = {< History/>}/>
    </Route>
   </Routes>
   </>
  );
}

export default App;
