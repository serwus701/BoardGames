import { ListQueueResponse, QueueReorderItemApi } from '@/types/Queue';
import { apiCall } from './baseApi';



export const queueAPI = {

    async listQueue() {
        const res = await apiCall<ListQueueResponse>('/game-queue', { method: 'GET' });
        return res.items;
    },

    // async addToQueue(
    //     item: QueueReorderItemApi,
    //     token: string
    // ) {
    //     return apiCall<QueueItem>('/game-queue', {
    //         method: 'POST',
    //         body: JSON.stringify(item),
    //         token,
    //     });
    // },

    async reorderQueue(
        items: QueueReorderItemApi[],
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