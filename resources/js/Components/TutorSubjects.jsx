import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

export default function TutorSubjects() {
    const { user } = useAuth();
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        
        if (user?.tutor_profile?.subjects) {
            setSelectedSubjectIds(user.tutor_profile.subjects.map(s => s.id));
        }

        const fetchCatalogue = async () => {
            try {
                
                const res = await axios.get('/api/v1/subjects');
                setAllSubjects(res.data.data.subjects);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
                setMessage({ type: 'error', text: 'Could not load the subject catalogue.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCatalogue();
    }, [user]);

    const toggleSubject = (subjectId) => {
        setSelectedSubjectIds(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            
            await axios.put('/api/v1/tutors/me', {
                subject_ids: selectedSubjectIds
            });

            setMessage({ type: 'success', text: 'Subjects successfully updated!' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save subjects:', error);
            setMessage({ type: 'error', text: 'Failed to save your selections. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500 py-4">Loading subject catalogue...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Teaching Subjects</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Select the subjects you are qualified to teach. Students will use these to find you in search.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isSaving ? 'Saving...' : 'Save Subjects'}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {allSubjects.map((subject) => {
                    const isSelected = selectedSubjectIds.includes(subject.id);
                    return (
                        <div
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id)}
                            className={`
                                relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all
                                ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}
                            `}
                        >
                            <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                    <div className="text-sm">
                                        <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {subject.name}
                                        </p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {allSubjects.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">No active subjects available in the platform yet.</p>
                </div>
            )}
        </div>
    );
}
