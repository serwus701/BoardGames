
export interface CustomGame {
    id: string;
    name: string;
    validPlayerCounts: number[];
    lengthInMinutes: number;
    addedByUserId: string;
    addedByName: string;
    addedAt: Date;
}

export interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface SharedGameInstance {
    id: string;
    gameId: string;
    addedByUserId: string;
    addedByName: string;
    addedAt: Date;
}

export interface GameQueueItem {
    id: string;
    gameInstanceId: string;
    gameId: string;
    addedByName: string;
    addedAt: Date;
    usedInEventId?: string;
    usedAt?: Date;
}


