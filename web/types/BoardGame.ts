import { User } from "./User";

export interface BoardGame extends EventGame {
    id: number;
    owner: User;
}

export interface EventGame {
    name: string;
    playerCountsType: 'exact' | 'minMax' | 'minOnly';
    playerCountsExact: number[];
    playerCountsMin: number;
    playerCountsMax: number;
    lengthInHours: number;
}