import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAuthenticatedUser = async () => {
        const res = await axios.get('/api/v1/auth/me');
        return res.data?.data?.user ?? null;
    };

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = localStorage.getItem('learnora_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const authenticatedUser = await fetchAuthenticatedUser();
                setUser(authenticatedUser);
            } catch (error) {
                localStorage.removeItem('learnora_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = async (email, password) => {
        try {
            await axios.get('/sanctum/csrf-cookie');

            const res = await axios.post('/api/v1/auth/login', { email, password });
            const accessToken = res.data?.data?.access_token;
            if (!accessToken) {
                return { success: false, message: 'Login failed. Access token was not returned.' };
            }

            localStorage.setItem('learnora_token', accessToken);

            const authenticatedUser = await fetchAuthenticatedUser();
            if (!authenticatedUser) {
                localStorage.removeItem('learnora_token');
                setUser(null);
                return { success: false, message: 'Login failed. Could not load your profile.' };
            }

            setUser(authenticatedUser);

            return { success: true, user: authenticatedUser };
        } catch (error) {
            localStorage.removeItem('learnora_token');
            setUser(null);
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            return { success: false, message };
        }
    };

    const register = async (name, email, password, password_confirmation, role) => {
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.post('/api/v1/auth/register', {
                name,
                email,
                password,
                password_confirmation,
                role
            });

            const accessToken = res.data?.data?.access_token;
            if (!accessToken) {
                return { success: false, message: 'Registration failed. Access token was not returned.' };
            }

            localStorage.setItem('learnora_token', accessToken);

            const authenticatedUser = await fetchAuthenticatedUser();
            if (!authenticatedUser) {
                localStorage.removeItem('learnora_token');
                setUser(null);
                return { success: false, message: 'Registration failed. Could not load your profile.' };
            }

            setUser(authenticatedUser);

            return { success: true, user: authenticatedUser };
        } catch (error) {
            localStorage.removeItem('learnora_token');
            setUser(null);
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/v1/auth/logout');
        } catch (error) {
            console.error('Logout failed on server, cleaning up locally anyway.');
        } finally {
            localStorage.removeItem('learnora_token');
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
