export interface RegistrationRequest {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    respondedAt?: Date;
    respondedBy?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    bio?: string;
    home_address?: string;
    role: 'head-admin' | 'admin' | 'user';
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    // Legacy fields for backward compatibility
    name?: string;
    homeAddress?: string;
    contributedGameIds?: string[];
    ownedGames?: string[];
}

export interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register?: (data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        bio?: string;
        home_address?: string;
    }) => Promise<void>;
    logout: () => void;
    refreshUserData: () => Promise<void>;
    isLoggedIn: boolean;
    token?: string | null;
}
