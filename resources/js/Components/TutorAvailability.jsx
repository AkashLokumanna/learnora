import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

const DAYS_OF_WEEK = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
];

export default function TutorAvailability() {
    const { user } = useAuth();

    const [schedule, setSchedule] = useState(
        DAYS_OF_WEEK.reduce((acc, day) => {
            acc[day.id] = { isActive: false, startTime: '09:00', endTime: '17:00' };
            return acc;
        }, {})
    );
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const res = await axios.get('/api/v1/availability');
                const slots = res.data.data.slots;
                
                if (slots.length > 0) {
                    setSchedule(prev => {
                        const newSchedule = { ...prev };
                        slots.forEach(slot => {
                            newSchedule[slot.day_of_week] = {
                                isActive: true,
                                
                                startTime: slot.start_time.substring(0, 5),
                                endTime: slot.end_time.substring(0, 5)
                            };
                        });
                        return newSchedule;
                    });
                }
            } catch (error) {
                console.error('Failed to fetch availability:', error);
                setMessage({ type: 'error', text: 'Could not load your schedule from the server.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, []);

    const handleToggle = (dayId) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: { ...prev[dayId], isActive: !prev[dayId].isActive }
        }));
    };

    const handleTimeChange = (dayId, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: { ...prev[dayId], [field]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        const activeSlots = Object.entries(schedule)
            .filter(([_, data]) => data.isActive)
            .map(([dayId, data]) => ({
                day_of_week: dayId,
                start_time: data.startTime,
                end_time: data.endTime
            }));

        try {
            await axios.post('/api/v1/availability/bulk-sync', {
                slots: activeSlots
            });
            setMessage({ type: 'success', text: 'Weekly schedule updated successfully!' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save schedule:', error);
            setMessage({ type: 'error', text: 'Failed to save schedule. Please check your times.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500 py-4">Loading your schedule...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Weekly Availability</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Set your standard weekly working hours. Students will only be able to book you during these times.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isSaving ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                    {DAYS_OF_WEEK.map((day) => {
                        const dayData = schedule[day.id];
                        return (
                            <div key={day.id} className="p-4 sm:flex sm:items-center sm:justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center mb-4 sm:mb-0 sm:w-1/3">
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(day.id)}
                                        className={`${
                                            dayData.isActive ? 'bg-blue-600' : 'bg-gray-200'
                                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-4`}
                                    >
                                        <span className={`${
                                            dayData.isActive ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                                    </button>
                                    <span className={`font-medium ${dayData.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {day.label}
                                    </span>
                                </div>

                                <div className={`flex items-center space-x-2 sm:w-2/3 sm:justify-end ${dayData.isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-500 sr-only">Start Time</label>
                                        <input
                                            type="time"
                                            value={dayData.startTime}
                                            onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                                            disabled={!dayData.isActive}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                    <span className="text-gray-400 px-2">to</span>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-500 sr-only">End Time</label>
                                        <input
                                            type="time"
                                            value={dayData.endTime}
                                            onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                                            disabled={!dayData.isActive}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
