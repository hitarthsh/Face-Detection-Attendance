import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Ensure stale tokens from previous environments don't interfere.
    await this.clearSession();

    const { data } = await api.post('/auth/login', credentials);
    
    if (!data?.data) {
      throw new Error('Invalid server response');
    }

    const { user, accessToken, refreshToken } = data.data;

    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);

    return { user, accessToken, refreshToken };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await this.clearSession();
    }
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },
};
