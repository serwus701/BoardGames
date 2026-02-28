import { User } from "./User";

export interface BoardGame extends EventGame {
    owner: User;
}

export interface EventGame extends GameItem {
    playerCountsType: 'exact' | 'minMax' | 'minOnly';
    playerCountsExact: number[];
    playerCountsMin: number;
    playerCountsMax: number;
}

export interface GameItem {
    id: number;
    name: string;
    lengthInMinutes: number;
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

export type EventGameForm = Omit<EventGame, "id" | "lengthInMinutes"> & {
    lengthInHours: number;
};

export interface ApiBoardGame {
    name: string;
    length_in_minutes: number;
    player_count_type: 'exact' | 'minMax' | 'minOnly';
    min_players: number;
    max_players: number;
    valid_player_counts: number[];
}