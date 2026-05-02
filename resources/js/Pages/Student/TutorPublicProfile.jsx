import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function TutorPublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [tutor, setTutor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [sessionDate, setSessionDate] = useState('');
    const [meetingType, setMeetingType] = useState('online');
    
    const [isBooking, setIsBooking] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`/api/v1/tutors/${id}`);
                setTutor(res.data.data.tutor);

                if (res.data.data.tutor.subjects?.length > 0) {
                    setSelectedSubject(res.data.data.tutor.subjects[0].id);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handleBook = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!selectedSubject || !selectedSlot || !sessionDate) {
            setBookingMessage({ type: 'error', text: 'Please select a subject, availability slot, and date.' });
            return;
        }

        setIsBooking(true);
        setBookingMessage(null);
        
        try {
            const res = await axios.post('/api/v1/bookings', {
                availability_id: selectedSlot.id,
                subject_id: selectedSubject,
                session_date: sessionDate,
                meeting_type: meetingType,
            });
            
            setBookingMessage({ type: 'success', text: 'Booking confirmed! Redirecting to dashboard...' });
            setTimeout(() => navigate('/student/dashboard'), 2000);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to book session.';
            setBookingMessage({ type: 'error', text: msg });
            setIsBooking(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading profile...</div>;
    if (!tutor) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-red-500">Tutor not found.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 w-full">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-blue-600 px-8 py-12 text-white">
                    <div className="flex items-center">
                        <div className="h-20 w-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold shadow-md">
                            {tutor.name.charAt(0)}
                        </div>
                        <div className="ml-6">
                            <h1 className="text-3xl font-bold">{tutor.name}</h1>
                            <p className="text-blue-100 mt-1 text-lg">{tutor.headline}</p>
                            <div className="flex items-center mt-2">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm text-blue-50 font-medium">
                                    {tutor.avg_rating > 0 ? tutor.avg_rating : 'New'} 
                                    {tutor.total_reviews > 0 ? ` (${tutor.total_reviews} reviews)` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-3xl font-bold">LKR {tutor.hourly_rate}</div>
                            <div className="text-blue-100 text-sm">per hour</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Left Column: Details */}
                    <div className="col-span-2 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About Me</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{tutor.about || tutor.bio}</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Subjects</h2>
                        <div className="flex flex-wrap gap-2">
                            {tutor.subjects?.map(sub => (
                                <span key={sub.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {sub.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Booking Engine */}
                    <div className="p-8 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Book a Session</h2>
                        
                        {bookingMessage && (
                            <div className={`mb-6 p-4 rounded-md text-sm ${bookingMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {bookingMessage.text}
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Subject Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
                                <select 
                                    value={selectedSubject} 
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">-- Choose Subject --</option>
                                    {tutor.subjects?.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Slot Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Availability Slot</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {tutor.availabilities?.length > 0 ? (
                                        tutor.availabilities.map(slot => (
                                            <div 
                                                key={slot.id}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`cursor-pointer p-3 rounded-md border text-sm ${selectedSlot?.id === slot.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
                                            >
                                                <div className="font-medium capitalize text-gray-900">{slot.day_of_week}s</div>
                                                <div className="text-gray-500">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No available slots.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
                                <input 
                                    type="date"
                                    value={sessionDate}
                                    onChange={e => setSessionDate(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                {selectedSlot && (
                                    <p className="mt-1 text-xs text-blue-600">Please choose a future date that falls on a {selectedSlot.day_of_week}.</p>
                                )}
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={isBooking || !selectedSlot}
                                className="w-full mt-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
                            >
                                {isBooking ? 'Confirming...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
