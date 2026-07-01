import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import taskReducer from './slices/taskSlice.js';
import scheduleReducer from './slices/scheduleSlice.js';
import alarmReducer from './slices/alarmSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    schedules: scheduleReducer,
    alarms: alarmReducer,
  },
});
