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

    const ADMIN_EMAILS = ['jack.elzarka@gmail.com', 'xxxbrjuice@gmail.com'];

    const login = async (email, password) => {
        // Mock simulation
        await new Promise(r => setTimeout(r, 1000));

        const db = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
        const normalizedEmail = email.toLowerCase();
        const existingUser = db[normalizedEmail];

        if (!existingUser) {
            throw new Error("You need to sign up first!");
        }

        if (existingUser.password !== password) {
            throw new Error("Incorrect password");
        }

        // Admin Override: Grant Premium
        if (ADMIN_EMAILS.includes(normalizedEmail)) {
            existingUser.plan = 'premium';
            // Save back to DB so it persists
            db[normalizedEmail] = existingUser;
            localStorage.setItem('mock_users_db', JSON.stringify(db));
        }

        setUser(existingUser);
        localStorage.setItem('user_session', JSON.stringify(existingUser));
        return existingUser;
    };

    const signup = async (name, email, password) => {
        await new Promise(r => setTimeout(r, 1500));

        const db = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
        const normalizedEmail = email.toLowerCase();

        if (db[normalizedEmail]) {
            throw new Error("Funny singer you already have an account");
        }

        // Check if Admin
        const isPremium = ADMIN_EMAILS.includes(normalizedEmail);

        const mockUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email: normalizedEmail,
            name,
            password,
            plan: isPremium ? 'premium' : null,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };

        db[normalizedEmail] = mockUser;
        localStorage.setItem('mock_users_db', JSON.stringify(db));

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
