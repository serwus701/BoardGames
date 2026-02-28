/**
 * API Client for Board Games Backend
 * Handles all communication with the Python FastAPI backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
    constructor(
        public status: number,
        public data: unknown,
        message: string
    ) {
        super(message);
    }
}

export async function apiCall<T>(
    path: string,
    options: RequestInit & { token?: string } = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...fetchOptions.headers,
    };

    const response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        headers,
    });

    // Handle 204 No Content (successful delete with no response body)
    if (response.status === 204) {
        if (!response.ok) {
            throw new APIError(response.status, {}, 'API Error');
        }
        return undefined as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new APIError(response.status, data, (data && (data as any).detail) || 'API Error');
    }

    return data as T;
}





