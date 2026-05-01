import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import TutorDashboard from './Pages/Dashboard/TutorDashboard';
import StudentDashboard from './Pages/Dashboard/StudentDashboard';
import AdminDashboard from './Pages/Dashboard/AdminDashboard';
import CouponManagement from './Pages/Admin/CouponManagement';
import FindTutors from './Pages/Student/FindTutors';
import TutorProfile from './Pages/Student/TutorProfile';
import Checkout from './Pages/Student/Checkout';
import DashboardLayout from './Layouts/DashboardLayout';

function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center">
            <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Learnora</h1>
            <p className="text-xl text-gray-600 mb-8">Premium 1-on-1 Tutoring.</p>
            <div className="space-x-4">
                <Link to="/login" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    Sign In
                </Link>
                <Link to="/register" className="px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200">
                    Sign Up
                </Link>
            </div>
        </div>
    );
}

function LegacyDashboardRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    
    if (user.role === 'tutor') return <Navigate to="/tutor/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <div>Dashboard not found for this role.</div>;
}

function ProtectedLayoutRoute() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;

    return <DashboardLayout />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<ProtectedLayoutRoute />}>
                    <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
                    <Route path="/tutor/dashboard" element={<TutorDashboard />} />
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/checkout" element={<Checkout />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/coupons" element={<CouponManagement />} />
                    <Route path="/student/find-tutors" element={<FindTutors />} />
                    <Route path="/tutors/:id" element={<TutorProfile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <AuthProvider>
                <App />
            </AuthProvider>
        </React.StrictMode>
    );
}
