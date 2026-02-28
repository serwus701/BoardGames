import { CustomGame, SharedGameInstance } from '@/types';
import { apiCall } from './baseApi';
import { BoardGame } from '@/types/BoardGame';


export const gamesAPI = {

    async listBoardGames() {
        return apiCall<BoardGame[]>('/games/board-games', {
            method: 'GET',
        });
    },

    async createBoardGame(game: Partial<BoardGame>, token: string) {
        return apiCall<BoardGame>('/games/board-games', {
            method: 'POST',
            body: JSON.stringify(game),
            token,
        });
    },


    async listCustomGames() {
        throw new Error('Not implemented');
        return apiCall<CustomGame[]>('/games/custom-games', {
            method: 'GET',
        });
    },

    async createCustomGame(
        game: {
            name: string;
            valid_player_counts: number[];
            length_in_minutes?: number;
        },
        token: string
    ) {
        throw new Error('Not implemented');
        return apiCall<CustomGame>('/games/custom-games', {
            method: 'POST',
            body: JSON.stringify(game),
            token,
        });
    },

    async getCustomGame(gameId: string) {
        throw new Error('Not implemented');
        return apiCall<CustomGame>(`/games/custom-games/${gameId}`, {
            method: 'GET',
        });
    },


    async updateCustomGame(gameId: string, data: Partial<CustomGame>, token: string) {
        throw new Error('Not implemented');
        return apiCall<CustomGame>(`/games/custom-games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },


    async deleteCustomGame(gameId: string, token: string) {
        throw new Error('Not implemented');
        return apiCall<void>(`/games/custom-games/${gameId}`, {
            method: 'DELETE',
            token,
        });
    },

    async listSharedInstances() {
        throw new Error('Not implemented');
        return apiCall<SharedGameInstance[]>('/games/shared-instances', {
            method: 'GET',
        });
    },

    async addGameInstance(
        props: {
            game_id?: string;
            custom_game_id?: string;
        },
        token: string
    ) {
        throw new Error('Not implemented');
        const params = new URLSearchParams();

        return apiCall<SharedGameInstance>(`/games/shared-instances?${params}`, {
            method: 'POST',
            token,
        });
    },
};