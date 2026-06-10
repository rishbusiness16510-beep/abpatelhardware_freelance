import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Restore from localStorage
const storedUser = localStorage.getItem('abpatel_user');
const storedToken = localStorage.getItem('abpatel_token');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk<{ user: User; token: string }, { email: string; password: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data as { user: User; token: string };
      localStorage.setItem('abpatel_token', token);
      localStorage.setItem('abpatel_user', JSON.stringify(user));
      return { user, token };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const phoneLogin = createAsyncThunk<{ user: User; token: string }, { idToken: string; name?: string }>(
  'auth/phoneLogin',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/phone-login', payload);
      const { user, token } = response.data as { user: User; token: string };
      localStorage.setItem('abpatel_token', token);
      localStorage.setItem('abpatel_user', JSON.stringify(user));
      return { user, token };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Phone verification failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('abpatel_token');
      localStorage.removeItem('abpatel_user');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Email Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Phone Login
      .addCase(phoneLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(phoneLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(phoneLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
