export interface BoardGame extends EventGame {
    id: number;
    ownerId: number;
}

export interface EventGame {
    name: string;
    playerCountsType: 'exact' | 'minMax' | 'minOnly';
    playerCountsExact: number[];
    playerCountsMin: number;
    playerCountsMax: number;
    lengthInHours: number;
}