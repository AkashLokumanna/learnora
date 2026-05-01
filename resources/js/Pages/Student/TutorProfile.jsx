import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../lib/axios';
import BookingModal from '../../Components/BookingModal';

export default function TutorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tutor, setTutor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    useEffect(() => {
        const fetchTutor = async () => {
            setIsLoading(true);
            setError('');
            try {
                const res = await axios.get(`/api/v1/tutors/${id}`);
                setTutor(res.data.data?.tutor ?? null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load tutor profile.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTutor();
    }, [id]);

    const profile = useMemo(() => tutor?.tutor_profile ?? null, [tutor]);
    const subjects = useMemo(() => tutor?.subjects ?? [], [tutor]);
    const reviews = useMemo(() => tutor?.reviews ?? [], [tutor]);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
                Loading tutor profile...
            </div>
        );
    }

    if (!tutor || error) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <p className="text-red-600">{error || 'Tutor not found.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/student/find-tutors')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Back to Tutor Search
                </button>
            </div>
        );
    }

    return (
        <>
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white shadow-lg sm:px-10">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{tutor.user?.name}</h1>
                            <p className="mt-2 text-blue-100">{profile?.headline || 'Professional tutor'}</p>
                            <div className="mt-3 flex items-center gap-3 text-sm text-blue-100">
                                <span>
                                    {Number(profile?.avg_rating || 0) > 0
                                        ? `${profile.avg_rating} / 5`
                                        : 'New tutor'}
                                </span>
                                <span>-</span>
                                <span>{profile?.total_reviews || 0} reviews</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white/15 px-5 py-4 text-right backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-blue-100">Hourly Rate</p>
                            <p className="text-2xl font-bold">LKR {profile?.hourly_rate ?? '0.00'}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">About Me</h2>
                            <p className="mt-3 whitespace-pre-wrap text-gray-700">
                                {profile?.about || tutor.user?.bio || 'This tutor has not added a detailed bio yet.'}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Subjects Taught</h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {subjects.map((subject) => (
                                    <span
                                        key={subject.id}
                                        className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                                    >
                                        {subject.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
                            {reviews.length === 0 ? (
                                <p className="mt-3 text-gray-500">No reviews yet.</p>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-900">{review.reviewer?.name || 'Student'}</p>
                                                <p className="text-sm font-medium text-yellow-600">{review.rating} / 5</p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700">{review.comment || 'No written feedback.'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Ready to start learning?</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Pick a subject, choose a date and reserve an available slot.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsBookingOpen(true)}
                                className="mt-5 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Book a Session
                            </button>
                        </div>
                    </aside>
                </section>
            </main>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                tutorId={id}
                subjects={subjects}
                availableDays={profile?.available_days ?? []}
                onBooked={() => {
                    window.alert('Booking created successfully. Redirecting to checkout.');
                }}
            />
        </>
    );
}
