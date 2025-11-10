import React from 'react'
import { assets } from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react"

const NavBar = () => {
    const navigate = useNavigate();
    const { user, isSignedIn } = useUser();
    const { openSignIn } = useClerk();

    const handleLogoClick = () => {
        console.log("Logo clicked"); // Debug log
        navigate("/");
    };

    const handleGetStartedClick = () => {
        console.log("Get Started clicked"); // Debug log
        openSignIn();
    };

    return (
        <div className="fixed top-0 z-50 w-full  backdrop-blur-md border-b border-gray-100 flex justify-between items-center py-3 px-4 sm:px-20 xl:px-32">
            <img 
                src={assets.logo} 
                alt="logo" 
                className="w-32 sm:w-44 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={handleLogoClick}
            />
            
            {user ? (
                <UserButton afterSignOutUrl="/" />
            ) : (
                <button 
                    className="flex items-center gap-2 rounded-full text-sm font-medium cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 transition-colors duration-200 shadow-lg hover:shadow-xl" 
                    onClick={handleGetStartedClick}
                >
                    Get Started 
                    <ArrowRight size={16} />
                </button>
            )}
        </div>
    )
}

export default NavBar