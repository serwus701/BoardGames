export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'head-admin';
    bio?: string;
    home_address?: string;
    created_at: string;
    updated_at: string;
}