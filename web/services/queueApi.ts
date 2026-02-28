import { ListQueueResponse, QueueItem } from '@/types/BoardGame';
import { apiCall } from './baseApi';



export const queueAPI = {

    async listQueue() {
        const res = await apiCall<ListQueueResponse>('/game-queue', { method: 'GET' });
        return res.items;
    },

    async addToQueue(
        item: {
            game_id: string;
            game_instance_id: string;
        },
        token: string
    ) {
        return apiCall<QueueItem>('/game-queue', {
            method: 'POST',
            body: JSON.stringify(item),
            token,
        });
    },

    async reorderQueue(
        items: string[],
        token: string
    ) {
        return apiCall<{ message: string }>('/game-queue/reorder', {
            method: 'POST',
            body: JSON.stringify({ items }),
            token,
        });
    },

    async removeFromQueue(queueItemId: string, token: string) {
        return apiCall<void>(`/game-queue/${queueItemId}`, {
            method: 'DELETE',
            token,
        });
    },
};