import React from 'react'
import { assets } from "../assets/assets.js";
import { useNavigate } from 'react-router-dom';
const Footer = () => {
    const navigate = useNavigate()
    const handleLogoClick = () => {
        console.log("Logo clicked"); // Debug log
        navigate("/");
    };
  return (
    <footer className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8 w-full text-gray-500">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500/30 pb-6">
                <div className="md:max-w-96">
                <img 
                src={assets.logo} 
                alt="logo" 
                className="w-32 sm:w-44 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={handleLogoClick}
            />
                    <p className="mt-6 text-sm">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
                        when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                    </p>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20">
                    <div>
                        <h2 className="font-semibold mb-5 text-gray-800">Company</h2>
                        <ul className="text-sm space-y-2">
                            <li><a href="#">Home</a></li>
                            <li><a href="#">About us</a></li>
                            <li><a href="#">Contact us</a></li>
                            <li><a href="#">Privacy policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold mb-5 text-gray-800">Get in touch</h2>
                        <div className="text-sm space-y-2">
                            <p>+91 212-456-7890</p>
                            <p>contact@example.com</p>

                            <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-indigo-50">
                                <input className="focus:ring-2 ring-indigo-600 outline-none w-full max-w-64 py-2 rounded px-2" type="email" placeholder="Enter your email" />
                                <button className="bg-indigo-600 px-4 py-2 text-white rounded">Subscribe</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center text-xs md:text-sm pb-5">
                Copyright 2024 © <a href="https://prebuiltui.com">PrebuiltUI</a>. All Right Reserved.
            </p>
        </footer>
  )
}

export default Footer
