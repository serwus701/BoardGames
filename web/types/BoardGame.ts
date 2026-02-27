import { User } from "./User";

export interface BoardGame extends EventGame {
    owner: User;
}

export interface EventGame extends QueueItem {
    playerCountsType: 'exact' | 'minMax' | 'minOnly';
    playerCountsExact: number[];
    playerCountsMin: number;
    playerCountsMax: number;
}

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