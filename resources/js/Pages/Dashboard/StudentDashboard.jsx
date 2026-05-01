import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import ReviewModal from '../../Components/ReviewModal';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBookings = async () => {
        try {
            const res = await axios.get('/api/v1/bookings');
            setBookings(res.data.data.bookings);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'student') {
            fetchBookings();
        }
    }, [user]);

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'student') return <Navigate to="/dashboard" replace />;

    return (
        <>
            <main className="flex-grow">
                {/* Hero Section */}
                <div className="bg-blue-600 text-white py-16 sm:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                            Find the perfect tutor on Learnora
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-blue-100 mb-10">
                            Master any subject with expert tutors tailored to your learning style.
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); if(searchQuery.trim()) navigate('/student/find-tutors?search=' + encodeURIComponent(searchQuery)); }} className="mt-8 sm:flex justify-center max-w-3xl mx-auto">
                            <div className="min-w-0 flex-1">
                                <label htmlFor="search" className="sr-only">Search for tutors or subjects</label>
                                <input
                                    id="search"
                                    type="text"
                                    placeholder="What do you want to learn? (e.g. Mathematics, John Doe)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full px-5 py-4 rounded-md border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300 shadow-sm sm:text-lg"
                                />
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-3">
                                <button
                                    type="submit"
                                    className="block w-full px-8 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            My Upcoming Sessions
                        </h2>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                        {isLoading ? (
                            <div className="p-6 text-gray-500 text-center">Loading bookings...</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                You have no upcoming sessions. Use the search above to find a tutor!
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <li key={booking.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {booking.tutor.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-lg font-medium text-gray-900">
                                                        {booking.subject.name} with {booking.tutor.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {booking.session_date} | {booking.time_from.substring(0, 5)} - {booking.time_to.substring(0, 5)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                {booking.payment_status === 'unpaid' && (
                                                    <button
                                                        onClick={() => navigate('/student/checkout')}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                                                    >
                                                        Go to Checkout
                                                    </button>
                                                )}
                                                {booking.payment_status === 'paid' && booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => setReviewBooking(booking)}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                                                    >
                                                        Leave Review
                                                    </button>
                                                )}
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
                                                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                                                >
                                                    {booking.status}
                                                </span>
                                                <span className="text-lg font-medium text-gray-900 whitespace-nowrap">
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

                {/* How it Works / Context Section */}
                <div className="bg-white py-16 sm:py-24 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-gray-900">How Learnora Works</h2>
                            <p className="mt-4 text-lg text-gray-500">Your journey to mastery in 3 simple steps</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6 text-2xl font-bold">1</div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Search</h3>
                                <p className="text-gray-500">Find expert tutors by subject or name. Browse profiles and reviews.</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6 text-2xl font-bold">2</div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Book</h3>
                                <p className="text-gray-500">Select an available time slot and securely pay for your session.</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6 text-2xl font-bold">3</div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Learn</h3>
                                <p className="text-gray-500">Connect with your tutor online and achieve your academic goals.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {reviewBooking && (
                <ReviewModal 
                    booking={reviewBooking} 
                    onClose={() => setReviewBooking(null)} 
                    onSuccess={() => {
                        alert("Thank you! Your review has been submitted.");
                        fetchBookings();
                    }}
                />
            )}
        </>
    );
}
