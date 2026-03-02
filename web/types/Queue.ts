

export interface QueueItem {
    id: number;
    name: string;
    lengthInHours: number;
}

export interface ListQueueResponse {
    items: {
        id: number;
        name: string;
        length_in_minutes: number;
    }[];
}

export interface QueueReorderItemApi {
    game_id: number;
    user_id: number;
}


