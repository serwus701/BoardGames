import { apiCall } from './baseApi';
import { ApiBoardGame, BoardGame } from '@/types/BoardGame';


export const gamesAPI = {

    async listBoardGames() {
        return apiCall<BoardGame[]>('/games', {
            method: 'GET',
        });
    },

    async createBoardGame(game: ApiBoardGame, token: string) {
        return apiCall<BoardGame>('/games', {
            method: 'POST',
            body: JSON.stringify(game),
            token,
        });
    },

};