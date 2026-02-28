import { apiCall } from './baseApi';

export const eventsAPI = {

    async listEvents() {
        return apiCall<Event[]>('/events', {
            method: 'GET',
        });
    },


    async createEvent(
        event: {
            date_time: string;
            location: string;
            organizer_id: string;
            estimated_length_in_minutes?: string;
            selected_games?: number[];
        },
        token: string
    ) {
        return apiCall<Event>('/events', {
            method: 'POST',
            body: JSON.stringify(event),
            token,
        });
    },


    async getEvent(eventId: string) {
        return apiCall<Event>(`/events/${eventId}`, {
            method: 'GET',
        });
    },


    async updateEvent(eventId: string, data: Partial<Event>, token: string) {
        return apiCall<Event>(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },


    async deleteEvent(eventId: string, token: string) {
        return apiCall<void>(`/events/${eventId}`, {
            method: 'DELETE',
            token,
        });
    },


    async registerForEvent(eventId: string, token: string) {
        return apiCall<{ success: boolean }>(`/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({}),
            token,
        });
    },

    async unregisterFromEvent(eventId: string, token: string) {
        return apiCall<void>(`/events/${eventId}/register`, {
            method: 'DELETE',
            token,
        });
    },
};