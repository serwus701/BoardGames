import { BoardGame } from "./BoardGame";
import { User } from "./User";

export interface Event {
    id: string;
    date_time: string;
    location: string;
    organizer: User;
    estimated_length_in_minutes?: string;
    selected_games?: BoardGame[];
    registered_players?: User[];
    created_at?: string;
    updated_at?: string;
    event_games: BoardGame[];
}