import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from '../../lib/axios';
import TutorSubjects from '../../Components/TutorSubjects';
import TutorAvailability from '../../Components/TutorAvailability';

export default function TutorDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [bookings, setBookings] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    useEffect(() => {
        if (activeTab === 'bookings') {
            setIsLoadingBookings(true);
            axios.get('/api/v1/bookings')
                .then(res => setBookings(res.data.data.bookings))
                .catch(err => console.error("Failed to load bookings", err))
                .finally(() => setIsLoadingBookings(false));
        }
    }, [activeTab]);

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'tutor') return <Navigate to="/dashboard" replace />;

    const tabs = [
        { id: 'profile', label: 'Profile Setup' },
        { id: 'subjects', label: 'Subjects' },
        { id: 'availability', label: 'Availability' },
        { id: 'bookings', label: 'My Bookings' },
    ];

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Tutor Workspace
                        </h2>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        {user.tutor_profile?.is_verified ? (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Verified Profile
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                Pending Verification
                            </span>
                        )}
                    </div>
                </div>

                {}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {}
                <div className="bg-white shadow rounded-lg p-6">
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Profile Setup</h3>
                            <p className="text-sm text-gray-500 mb-6">Manage your public tutoring profile, hourly rate, and teaching preferences.</p>

                            {}
                            <form className="space-y-6 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Headline</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        defaultValue={user.tutor_profile?.headline || ''}
                                        placeholder="Expert Maths Tutor with 8 Years Experience"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">About (Bio)</label>
                                    <textarea
                                        rows={4}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        defaultValue={user.tutor_profile?.about || ''}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Hourly Rate (LKR)</label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            defaultValue={user.tutor_profile?.hourly_rate || 0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            defaultValue={user.tutor_profile?.experience_years || 0}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <TutorSubjects />
                    )}

                    {activeTab === 'availability' && (
                        <TutorAvailability />
                    )}

                    {activeTab === 'bookings' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">My Bookings</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        View your upcoming tutoring sessions.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                {isLoadingBookings ? (
                                    <div className="p-6 text-gray-500">Loading bookings...</div>
                                ) : bookings.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        You have no upcoming sessions.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {bookings.map((booking) => (
                                            <li key={booking.id} className="p-4 sm:p-6 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                            {booking.student.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {booking.subject.name} session with {booking.student.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {booking.session_date} | {booking.time_from.substring(0, 5)} - {booking.time_to.substring(0, 5)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                                                        >
                                                            {booking.status}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            LKR {booking.amount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
