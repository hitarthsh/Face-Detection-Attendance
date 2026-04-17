import axios from 'axios';
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
  smcAccessToken?: string;
}

interface SmcTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

const SMC_TOKEN_URL = 'https://smc.cusmc.org/token';
const SMC_TOKEN_GRANT_TYPE = 'password';

export const authService = {
  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'user',
      'smcAccessToken',
      'smcRefreshToken',
      'smcTokenType',
      'smcExpiresIn',
    ]);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Ensure stale tokens from previous environments don't interfere.
    await this.clearSession();

    let smcToken: SmcTokenResponse | null = null;
    try {
      const smcBody = new URLSearchParams();
      smcBody.append('grant_type', SMC_TOKEN_GRANT_TYPE);
      smcBody.append('username', credentials.email.trim());
      smcBody.append('password', credentials.password);

      const { data } = await axios.post<SmcTokenResponse>(SMC_TOKEN_URL, smcBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      });

      if (!data?.access_token) {
        throw new Error('SMC token missing in response');
      }
      smcToken = data;
    } catch (error) {
      // Keep this explicit because SMC auth is required during sign-in.
      throw new Error('SMC authentication failed. Please verify your credentials.');
    }

    const { data } = await api.post('/auth/login', credentials);
    
    if (!data?.data) {
      throw new Error('Invalid server response');
    }

    const { user, accessToken, refreshToken } = data.data;

    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
      ['smcAccessToken', smcToken.access_token],
      ['smcRefreshToken', smcToken.refresh_token ?? ''],
      ['smcTokenType', smcToken.token_type ?? ''],
      ['smcExpiresIn', String(smcToken.expires_in ?? '')],
    ]);

    return { user, accessToken, refreshToken, smcAccessToken: smcToken.access_token };
  },

  async logout(): Promise<void> {
    try {
      // Send an object body to avoid Express JSON strict-mode parse errors on `null`.
      await api.post('/auth/logout', {});
    } finally {
      await this.clearSession();
    }
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr || userStr === 'null' || userStr === 'undefined') {
      return null;
    }

    try {
      return JSON.parse(userStr) as User;
    } catch {
      // Recover from corrupted/stale storage values.
      await AsyncStorage.removeItem('user');
      return null;
    }
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
