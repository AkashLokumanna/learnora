import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';

export default function FindTutors() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [tutors, setTutors] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Basic role protection
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'student') return <Navigate to="/dashboard" replace />;

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await axios.get('/api/v1/subjects');
                setSubjects(res.data.data.subjects);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchTutors = async () => {
            setIsLoading(true);
            try {
                const params = {};
                if (selectedSubject) params.subject_id = selectedSubject;
                if (!selectedSubject && searchQuery) params.search = searchQuery;

                const res = await axios.get('/api/v1/search/tutors', { params });
                setTutors(res.data.data.tutors);
            } catch (error) {
                console.error('Failed to fetch tutors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTutors();
    }, [selectedSubject, searchQuery]);

    return (
        <>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Discover Expert Tutors
                        </h2>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row md:ml-4 md:mt-0 gap-4">
                        <div className="relative rounded-md shadow-sm w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="Search tutors or subjects..."
                                value={searchQuery}
                                onChange={(e) => {
                                    const newParams = new URLSearchParams(searchParams);
                                    if (e.target.value) {
                                        newParams.set('search', e.target.value);
                                    } else {
                                        newParams.delete('search');
                                    }
                                    setSearchParams(newParams, { replace: true });
                                }}
                            />
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="block w-full sm:w-48 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Searching for perfect matches...</div>
                ) : (
                    <>
                        {tutors.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-500">No tutors found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {tutors.map((tutor) => (
                                    <div key={tutor.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {tutor.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-medium text-gray-900">{tutor.name}</h3>
                                                    <div className="flex items-center mt-1">
                                                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="ml-1 text-sm text-gray-600">
                                                            {tutor.avg_rating > 0 ? tutor.avg_rating : 'New'} 
                                                            {tutor.total_reviews > 0 ? ` (${tutor.total_reviews} reviews)` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-sm text-gray-500 line-clamp-2">
                                                {tutor.headline || "Experienced tutor ready to help you succeed."}
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {tutor.subjects.map(sub => (
                                                    <span key={sub.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {sub.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                                            <span className="text-lg font-bold text-gray-900">
                                                LKR {tutor.hourly_rate} <span className="text-sm font-normal text-gray-500">/ hr</span>
                                            </span>
                                            <Link to={`/tutors/${tutor.id}`} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                View Profile
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
