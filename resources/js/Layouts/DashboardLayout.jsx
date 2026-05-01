import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="text-xl font-bold text-blue-600">
                                Learnora
                            </Link>
                            {user && (
                                <Link 
                                    to={`/${user.role}/dashboard`} 
                                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                                >
                                    Dashboard
                                </Link>
                            )}
                            {user?.role === 'student' && (
                                <Link
                                    to="/student/find-tutors"
                                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                                >
                                    Find a Tutor
                                </Link>
                            )}
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin/coupons"
                                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                                >
                                    Coupons
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center space-x-6">
                            {user && <span className="text-sm text-gray-600">Hello, {user.name}</span>}
                            <button
                                onClick={logout}
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-grow flex flex-col">
                <Outlet />
            </div>
            
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex justify-center space-x-6 md:order-2">
                        <span className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors">About</span>
                        <span className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors">Help Center</span>
                        <span className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors">Terms</span>
                        <span className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors">Privacy</span>
                    </div>
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-base text-gray-400">
                            &copy; {new Date().getFullYear()} Learnora, Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
