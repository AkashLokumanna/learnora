import Axios from 'axios';

const axios = Axios.create({
    baseURL: import.meta.env.VITE_APP_URL || 'http://learnora.test',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true, 
});

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('learnora_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axios;