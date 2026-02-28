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
    bio?: string;
    role: 'head-admin' | 'admin' | 'user';
    created_at: string;
    updated_at: string;
    name: string;
    homeAddress?: string;
    phone?: string;
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
