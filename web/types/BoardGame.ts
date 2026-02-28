import { User } from "./User";

export interface BoardGame extends EventGame {
    owner: User;
}

export interface EventGame extends QueueItem {
    playerCountsType: 'specific' | 'range' | 'minimum';
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

export type EventGameForm = Omit<EventGame, "id">;

export interface ApiBoardGame {
    name: string;
    length_in_minutes: number;
    player_count_type: 'specific' | 'range' | 'minimum';
    min_players: number;
    max_players: number;
    valid_player_counts: number[];
}