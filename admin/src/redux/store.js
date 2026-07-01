import { configureStore } from '@reduxjs/toolkit';
import adminAuthReducer from './slices/authSlice.js';

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
  },
});
