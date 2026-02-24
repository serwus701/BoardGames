'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';

interface EventEditModalProps {
    isOpen: boolean;
    event: Event | null;
    onClose: () => void;
    onSave: (updatedEvent: Partial<Event>) => Promise<void>;
    isLoading?: boolean;
    error?: string;
}

export default function EventEditModal({
    isOpen,
    event,
    onClose,
    onSave,
    isLoading = false,
    error = ''
}: EventEditModalProps) {
    const [formData, setFormData] = useState({
        date_time: '',
        estimated_length_in_hours: '',
    });

    // Update form when event changes
    useEffect(() => {
        if (event) {
            const hoursFromMinutes = event.estimated_length_in_minutes
                ? String(parseFloat(event.estimated_length_in_minutes) / 60)
                : '';

            setFormData({
                date_time: event.date_time || '',
                estimated_length_in_hours: hoursFromMinutes,
            });
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert hours back to minutes for backend
        const dataToSave: any = {
            date_time: formData.date_time,
        };

        if (formData.estimated_length_in_hours) {
            dataToSave.estimated_length_in_minutes = String(parseFloat(formData.estimated_length_in_hours) * 60);
        }

        await onSave(dataToSave);
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            name="date_time"
                            value={formData.date_time ? formData.date_time.slice(0, 16) : ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location (from organizer's profile)
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                            {event?.location || 'Not set'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Location cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Length (hours)
                        </label>
                        <input
                            type="number"
                            name="estimated_length_in_hours"
                            value={formData.estimated_length_in_hours || ''}
                            onChange={handleChange}
                            placeholder="e.g., 3"
                            step="0.5"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
