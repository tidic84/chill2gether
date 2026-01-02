import { createContext, useContext, useState, useEffect } from "react";

const baseUrl = import.meta.env.VITE_BACKEND_URL;
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem("token"));

    // Vérifier si l'utilisateur est connecté au chargement
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem("token");

            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/api/users/me`, {
                    headers: {
                        "Authorization": `Bearer ${storedToken}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setToken(storedToken);
                } else {
                    // Token invalide, on le supprime
                    localStorage.removeItem("token");
                    setToken(null);
                }
            } catch (error) {
                console.error("Erreur lors de la vérification de l'auth:", error);
                localStorage.removeItem("token");
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${baseUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erreur lors de la connexion");
        }

        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);

        return data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prev => ({
            ...prev,
            ...userData
        }));
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
