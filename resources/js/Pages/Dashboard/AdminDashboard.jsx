import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [tutors, setTutors] = useState([]);
    const [tutorsLoading, setTutorsLoading] = useState(false);
    const [tutorsError, setTutorsError] = useState(null);
    const [tutorStatusFilter, setTutorStatusFilter] = useState('pending');
    const [tutorSearch, setTutorSearch] = useState('');
    const [tutorActionId, setTutorActionId] = useState(null);
    const [tutorActionMessage, setTutorActionMessage] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get('/api/v1/admin/analytics');
                setAnalytics(res.data.data);
            } catch (error) {
                console.error("Failed to load admin analytics", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchAnalytics();
        }
    }, [user]);

    const loadTutors = useCallback(async () => {
        setTutorsLoading(true);
        setTutorsError(null);
        try {
            const params = {};
            if (tutorStatusFilter) params.status = tutorStatusFilter;
            if (tutorSearch.trim()) params.search = tutorSearch.trim();
            const res = await axios.get('/api/v1/admin/tutors', { params });
            setTutors(res.data?.data?.tutors ?? []);
        } catch (err) {
            setTutorsError(err.response?.data?.message || 'Failed to load tutors.');
        } finally {
            setTutorsLoading(false);
        }
    }, [tutorStatusFilter, tutorSearch]);

    useEffect(() => {
        if (activeTab === 'tutors' && user?.role === 'admin') {
            loadTutors();
        }
    }, [activeTab, user, loadTutors]);

    const verifyTutor = async (tutorId) => {
        setTutorActionId(tutorId);
        setTutorActionMessage(null);
        try {
            await axios.patch(`/api/v1/admin/tutors/${tutorId}/verify`);
            setTutorActionMessage({ type: 'success', text: 'Tutor verified and activated.' });
            await loadTutors();
        } catch (err) {
            setTutorActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to verify tutor.' });
        } finally {
            setTutorActionId(null);
        }
    };

    const suspendTutor = async (tutorId) => {
        if (!window.confirm('Suspend this tutor? They will be hidden from search and signed out.')) return;
        setTutorActionId(tutorId);
        setTutorActionMessage(null);
        try {
            await axios.patch(`/api/v1/admin/tutors/${tutorId}/suspend`);
            setTutorActionMessage({ type: 'success', text: 'Tutor account suspended.' });
            await loadTutors();
        } catch (err) {
            setTutorActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to suspend tutor.' });
        } finally {
            setTutorActionId(null);
        }
    };

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'tutors', label: 'Tutors' },
    ];

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Admin Console
                        </h2>
                    </div>
                </div>

                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'overview' && (
                    <>
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Loading analytics engine...</div>
                        ) : analytics ? (
                            <>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue (LKR)</dt>
                                                        <dd>
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {analytics.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                                                        <dd>
                                                            <div className="text-lg font-bold text-gray-900">{analytics.total_bookings}</div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 rounded-md bg-indigo-100 flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">Approved Tutors</dt>
                                                        <dd>
                                                            <div className="text-lg font-bold text-gray-900">{analytics.total_tutors}</div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">Registered Students</dt>
                                                        <dd>
                                                            <div className="text-lg font-bold text-gray-900">{analytics.total_students}</div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white shadow rounded-lg p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Booking Volume (Last 6 Months)</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analytics.chart_data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="bookings"
                                                    stroke="#2563eb"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-red-500">Failed to load analytics data.</div>
                        )}
                    </>
                )}

                {activeTab === 'tutors' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Tutor Verifications</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Verify pending tutors so they appear in student search.
                                </p>
                            </div>
                            <button
                                onClick={loadTutors}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                <select
                                    value={tutorStatusFilter}
                                    onChange={(e) => setTutorStatusFilter(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={tutorSearch}
                                    onChange={(e) => setTutorSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') loadTutors(); }}
                                    placeholder="Search by name or email..."
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {tutorActionMessage && (
                            <div className={`mb-4 text-sm rounded-md p-3 ${
                                tutorActionMessage.type === 'success'
                                    ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                    : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                            }`}>
                                {tutorActionMessage.text}
                            </div>
                        )}

                        {tutorsError && (
                            <div className="mb-4 text-sm rounded-md p-3 bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                                {tutorsError}
                            </div>
                        )}

                        {tutorsLoading ? (
                            <div className="py-12 text-center text-gray-500">Loading tutors...</div>
                        ) : tutors.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">No tutors match the current filter.</div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tutors.map((tutor) => {
                                            const profile = tutor.tutor_profile;
                                            const isVerified = profile?.is_verified;
                                            const isSuspended = tutor.status === 'suspended';
                                            const isBusy = tutorActionId === tutor.id;
                                            return (
                                                <tr key={tutor.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                                                        <div className="text-xs text-gray-500">{tutor.email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                                            tutor.status === 'active' ? 'bg-green-100 text-green-800'
                                                                : tutor.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {tutor.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {isVerified ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Verified</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Unverified</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {profile?.subjects?.length
                                                            ? profile.subjects.map((s) => s.name).join(', ')
                                                            : <span className="text-gray-400">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                        {profile?.hourly_rate != null
                                                            ? `LKR ${Number(profile.hourly_rate).toLocaleString()}`
                                                            : <span className="text-gray-400">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        {!isVerified || tutor.status !== 'active' ? (
                                                            <button
                                                                disabled={isBusy || !profile}
                                                                onClick={() => verifyTutor(tutor.id)}
                                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-1.5 px-3 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {isBusy ? 'Working...' : 'Verify'}
                                                            </button>
                                                        ) : null}
                                                        {!isSuspended && (
                                                            <button
                                                                disabled={isBusy}
                                                                onClick={() => suspendTutor(tutor.id)}
                                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-1.5 px-3 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {isBusy ? 'Working...' : 'Suspend'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
