import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); // { id: "", name: "", role: "victim" | "officer" }
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    // Restore session from localStorage on mount
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("authToken");

            if (token) {
                try {
                    // Verify token with backend
                    const response = await fetch('http://localhost:5000/api/auth/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthenticated(true);
                        setUser({
                            id: data.user.id,
                            name: data.user.fullName,
                            role: data.user.role,
                            email: data.user.email
                        });
                        console.log("✅ Session restored:", data.user);
                    } else {
                        // Token invalid, clear storage
                        localStorage.removeItem("authToken");
                    }
                } catch (error) {
                    console.error("Session restore failed:", error);
                    localStorage.removeItem("authToken");
                }
            }

            // Mark loading as complete
            setIsLoading(false);
        };

        restoreSession();
    }, []);

    const login = (token, user) => {
        console.log("🔐 Login with backend token:", { user });

        // Store token
        localStorage.setItem("authToken", token);

        // Update state
        setIsAuthenticated(true);
        setUser({
            id: user.id,
            name: user.fullName,
            role: user.role,
            email: user.email
        });
    };

    const logout = () => {
        console.log("🚪 Logout");

        // Clear token
        localStorage.removeItem("authToken");

        // Update state
        setIsAuthenticated(false);
        setUser(null);
    };

    const value = {
        isAuthenticated,
        user,
        login,
        logout,
        isLoading, // Expose loading state
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
