import { BoardGame } from "./BoardGame";

export interface Event {
    id: string;
    date_time: string;
    location: string;
    organizer_id: string;
    estimated_length_in_minutes?: string;
    selected_games?: number[];
    registered_players?: string[];
    created_at?: string;
    updated_at?: string;
    event_games: BoardGame[];
}