import React, { useState } from 'react'
import { Outlet, useNavigate } from "react-router-dom"
import { assets } from "../assets/assets"
import { X, Menu } from "lucide-react"
import SideBar from '../components/SideBar'
import { useUser, SignIn } from '@clerk/clerk-react'


const Layout = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useUser();
  const [sidebar, setSidebar] = useState(false)


  return isSignedIn ? (
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200'>
        <img src={assets.logo} alt="" onClick={() => navigate('/')} />
        {
          sidebar ?
            <X onClick={() => setSidebar(false)} className='w-6 h-6 text-gray-600 sm:hidden' />
            : <Menu onClick={() => setSidebar(true)} className='w-6 h-6 text-gray-600 sm:hidden' />
        }
      </nav>
      <div className="flex w-full h-[calc(100vh-64px)]">
  {/* Sidebar */}
  <SideBar sidebar={sidebar} setSidebar={setSidebar} />

  {/* Main Content */}
  <div className="flex-1 w-full bg-[#F4F7FB] overflow-y-auto">
    <Outlet />
  </div>
</div>
      
      
    </div>
  ) : (
<div className='flex items-center justify-center h-screen'>
  <SignIn />
</div>
  )
}

export default Layout

