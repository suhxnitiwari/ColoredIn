import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const errorMessage = (err) => err.response?.data?.error || err.message || 'Something went wrong.';

export default api;
