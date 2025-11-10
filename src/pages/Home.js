import React from 'react'
import NavBar from '../components/NavBar.jsx'
import Hero from '../components/Hero.jsx'
import AITools from '../components/AITools.jsx'
import Testimonials from '../components/Testimonials.jsx'
import Plains from '../components/Plains.jsx'
import Footer from '../components/Footer.jsx'

const Home = () => {
  return (
    <>
   <NavBar />
   <Hero />
   <AITools />
   <Testimonials />
   <Plains/>
   <Footer/>
    </>
  )
}

export default Home;
