import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user_session');
            let userData = null;
            if (stored) {
                userData = JSON.parse(stored);
                setUser(userData);
            }

            // Check for Stripe success redirect
            const params = new URLSearchParams(window.location.search);
            if (params.get('success') === 'true' && userData) {
                const upgradedUser = { ...userData, plan: 'premium' };
                setUser(upgradedUser);
                localStorage.setItem('user_session', JSON.stringify(upgradedUser));
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

        } catch (e) {
            console.error("Failed to parse session", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        // Mock simulation
        await new Promise(r => setTimeout(r, 1000));

        const mockUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };

        setUser(mockUser);
        localStorage.setItem('user_session', JSON.stringify(mockUser));
        return mockUser;
    };

    const signup = async (name, email, password) => {
        await new Promise(r => setTimeout(r, 1500));
        const mockUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email,
            name,
            plan: null, // Forces pricing screen
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };
        setUser(mockUser);
        localStorage.setItem('user_session', JSON.stringify(mockUser));
        return mockUser;
    };

    const updatePlan = (plan) => {
        const updatedUser = { ...user, plan };
        setUser(updatedUser);
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updatePlan, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
