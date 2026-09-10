const KEY = "token";

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (token: string) => localStorage.setItem(KEY, token);
export const clearToken = () => localStorage.removeItem(KEY);
