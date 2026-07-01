import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminApi } from '../../services/adminApi';

export const adminLogin = createAsyncThunk('admin/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await adminApi.login(credentials);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

const initialState = {
  user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  token: localStorage.getItem('adminToken') || null,
  isAuthenticated: !!localStorage.getItem('adminToken'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('adminToken', action.payload.token);
        localStorage.setItem('adminUser', JSON.stringify(action.payload.user));
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
