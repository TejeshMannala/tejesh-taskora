import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleApi } from '../../services/scheduleApi';

export const fetchTodaySchedule = createAsyncThunk('schedules/fetchToday', async (_, { rejectWithValue }) => {
  try {
    return await scheduleApi.getToday();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedule');
  }
});

export const fetchWeeklySchedule = createAsyncThunk('schedules/fetchWeekly', async (_, { rejectWithValue }) => {
  try {
    return await scheduleApi.getWeekly();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedule');
  }
});

const initialState = {
  todayTasks: [],
  todaySchedules: [],
  weeklyTasks: [],
  weeklySchedules: [],
  isLoading: false,
  error: null,
};

const scheduleSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodaySchedule.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTodaySchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayTasks = action.payload.tasks || [];
        state.todaySchedules = action.payload.schedules || [];
      })
      .addCase(fetchTodaySchedule.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchWeeklySchedule.fulfilled, (state, action) => {
        state.weeklyTasks = action.payload.tasks || [];
        state.weeklySchedules = action.payload.schedules || [];
      });
  },
});

export default scheduleSlice.reducer;
