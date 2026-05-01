import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('learnora_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get('/api/v1/auth/me');
                setUser(res.data.data.user);
            } catch (error) {
                
                localStorage.removeItem('learnora_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email, password) => {
        try {
            
            await axios.get('/sanctum/csrf-cookie');

            const res = await axios.post('/api/v1/auth/login', { email, password });
            
            const { user, access_token } = res.data.data;

            localStorage.setItem('learnora_token', access_token);

            setUser(user);
            
            return { success: true, user };
        } catch (error) {
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

            const { user, access_token } = res.data.data;
            localStorage.setItem('learnora_token', access_token);
            setUser(user);
            
            return { success: true, user };
        } catch (error) {
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
