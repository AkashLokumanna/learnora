import React, { useMemo, useState } from 'react';
import axios from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time) {
    return time ? time.slice(0, 5) : '';
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTomorrow() {
    const now = new Date();
    return startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

function buildCalendarDays(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const leadingBlankDays = firstDayOfMonth.getDay();
    const days = [];

    for (let i = 0; i < leadingBlankDays; i += 1) {
        days.push(null);
    }
    for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
        days.push(new Date(year, month, day));
    }

    return days;
}

export default function BookingModal({ isOpen, onClose, tutorId, subjects, availableDays = [], onBooked }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [subjectId, setSubjectId] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedDateHasNoAvailability, setSelectedDateHasNoAvailability] = useState(false);

    const tomorrow = useMemo(() => getTomorrow(), []);
    const [calendarMonth, setCalendarMonth] = useState(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));

    const availableDayIndexes = useMemo(() => {
        return new Set(
            availableDays
                .map((day) => WEEKDAY_NAMES.findIndex((label) => label.toLowerCase() === String(day).toLowerCase()))
                .filter((index) => index >= 0)
        );
    }, [availableDays]);

    const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
    const canGoPreviousMonth = useMemo(() => {
        const firstVisibleMonthDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const firstAllowedMonth = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
        return firstVisibleMonthDay > firstAllowedMonth;
    }, [calendarMonth, tomorrow]);

    const resetState = () => {
        setStep(1);
        setSubjectId('');
        setSessionDate('');
        setSlots([]);
        setSelectedSlot(null);
        setIsLoadingSlots(false);
        setIsSubmitting(false);
        setError('');
        setSelectedDateHasNoAvailability(false);
        setCalendarMonth(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDateChange = async (dateValue) => {
        setSessionDate(dateValue);
        setSelectedSlot(null);
        setSlots([]);
        setError('');
        setSelectedDateHasNoAvailability(false);

        if (!dateValue) return;

        setIsLoadingSlots(true);
        try {
            const res = await axios.get(`/api/v1/tutors/${tutorId}/availability`, {
                params: { date: dateValue },
            });
            const fetchedSlots = res.data.data?.slots ?? [];
            setSlots(fetchedSlots);
            setSelectedDateHasNoAvailability(fetchedSlots.length === 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load availability.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDayClick = (date) => {
        const isPastOrToday = startOfDay(date) < tomorrow;
        const isWorkingDay = availableDayIndexes.has(date.getDay());
        if (isPastOrToday || !isWorkingDay) {
            return;
        }

        const dateValue = toDateKey(date);
        handleDateChange(dateValue);
    };

    const handleConfirmBooking = async () => {
        if (!subjectId || !sessionDate || !selectedSlot) {
            setError('Please complete all booking steps.');
            return;
        }

        const meetingType = selectedSlot.meeting_type === 'both' ? 'online' : selectedSlot.meeting_type;

        setIsSubmitting(true);
        setError('');
        try {
            await axios.post('/api/v1/bookings', {
                availability_id: selectedSlot.availability_id,
                subject_id: Number(subjectId),
                session_date: sessionDate,
                meeting_type: meetingType,
            });
            if (onBooked) onBooked();
            handleClose();
            navigate('/student/checkout');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Book a Session</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        X
                    </button>
                </div>

                <div className="px-6 py-5">
                    <div className="mb-5 flex items-center gap-2 text-xs font-medium text-gray-500">
                        <span className={step >= 1 ? 'text-blue-600' : ''}>1. Subject</span>
                        <span>/</span>
                        <span className={step >= 2 ? 'text-blue-600' : ''}>2. Date</span>
                        <span>/</span>
                        <span className={step >= 3 ? 'text-blue-600' : ''}>3. Time</span>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="booking-subject">
                                Select Subject
                            </label>
                            <select
                                id="booking-subject"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Choose a subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-700">Choose Date</p>
                                <div className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                    Blue dates are available working days
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        disabled={!canGoPreviousMonth}
                                        onClick={() =>
                                            setCalendarMonth(
                                                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                                            )
                                        }
                                        className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCalendarMonth(
                                                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                                            )
                                        }
                                        className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500">
                                    {WEEKDAY_LABELS.map((label) => (
                                        <div key={label}>{label}</div>
                                    ))}
                                </div>
                                <div className="mt-2 grid grid-cols-7 gap-2">
                                    {calendarDays.map((date, index) => {
                                        if (!date) {
                                            return <div key={`blank-${index}`} className="h-10" />;
                                        }

                                        const dateKey = toDateKey(date);
                                        const isSelected = sessionDate === dateKey;
                                        const isPastOrToday = startOfDay(date) < tomorrow;
                                        const isWorkingDay = availableDayIndexes.has(date.getDay());
                                        const isDisabled = isPastOrToday || !isWorkingDay;

                                        return (
                                            <button
                                                key={dateKey}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => handleDayClick(date)}
                                                className={`h-10 rounded-md border text-sm font-medium ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                        : isDisabled
                                                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                                                          : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400'
                                                }`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {sessionDate && (
                                <p className="text-sm text-gray-600">
                                    Selected date: <span className="font-medium text-gray-900">{sessionDate}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Available Time Slots</label>
                            {isLoadingSlots ? (
                                <p className="text-sm text-gray-500">Loading available slots...</p>
                            ) : selectedDateHasNoAvailability ? (
                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    No availabilities for this day. Please select another date.
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-gray-500">Choose a date first to see available time slots.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot.availability_id}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`rounded-full border px-4 py-2 text-sm font-medium ${
                                                selectedSlot?.availability_id === slot.availability_id
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
                                            }`}
                                        >
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={step === 1 ? handleClose : () => setStep((prev) => prev - 1)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 1 && !subjectId) {
                                    setError('Please select a subject.');
                                    return;
                                }
                                if (step === 2 && !sessionDate) {
                                    setError('Please select a date.');
                                    return;
                                }
                                setError('');
                                setStep((prev) => prev + 1);
                            }}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleConfirmBooking}
                            disabled={!selectedSlot || isSubmitting}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
