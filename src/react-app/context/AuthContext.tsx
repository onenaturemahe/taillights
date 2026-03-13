import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: number;
    username: string;
    role: "admin" | "moderator" | "user";
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string, turnstileToken?: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const savedToken = localStorage.getItem("auth_token");
            if (savedToken) {
                try {
                    const response = await fetch("/api/auth/me", {
                        headers: {
                            "Authorization": `Bearer ${savedToken}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                        setToken(savedToken);
                    } else {
                        localStorage.removeItem("auth_token");
                        setToken(null);
                    }
                } catch (err) {
                    console.error("Auth check failed:", err);
                    localStorage.removeItem("auth_token");
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string, turnstileToken?: string) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, turnstileToken })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }

        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("auth_token", data.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
