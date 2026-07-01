import { createSlice } from '@reduxjs/toolkit';

const loadAlarmsFromStorage = () => {
  try {
    const stored = localStorage.getItem('activeAlarms');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAlarmsToStorage = (alarms) => {
  try {
    localStorage.setItem('activeAlarms', JSON.stringify(alarms));
  } catch {}
};

const initialState = {
  activeAlarms: loadAlarmsFromStorage(),
  currentAlarm: null,
  showOverlay: false,
};

const alarmSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    setActiveAlarms: (state, action) => {
      state.activeAlarms = action.payload;
      saveAlarmsToStorage(action.payload);
    },
    addAlarm: (state, action) => {
      const exists = state.activeAlarms.find((a) => a._id === action.payload._id || a.taskId === action.payload.taskId);
      if (!exists) {
        state.activeAlarms.push(action.payload);
        saveAlarmsToStorage(state.activeAlarms);
      }
    },
    removeAlarm: (state, action) => {
      state.activeAlarms = state.activeAlarms.filter(
        (a) => a._id !== action.payload && a.taskId !== action.payload
      );
      saveAlarmsToStorage(state.activeAlarms);
      if (state.currentAlarm?._id === action.payload || state.currentAlarm?.taskId === action.payload) {
        state.currentAlarm = null;
        state.showOverlay = false;
      }
    },
    setCurrentAlarm: (state, action) => {
      state.currentAlarm = action.payload;
      state.showOverlay = true;
    },
    hideOverlay: (state) => {
      state.showOverlay = false;
    },
    clearAllAlarms: (state) => {
      state.activeAlarms = [];
      state.currentAlarm = null;
      state.showOverlay = false;
      saveAlarmsToStorage([]);
    },
  },
});

export const {
  setActiveAlarms,
  addAlarm,
  removeAlarm,
  setCurrentAlarm,
  hideOverlay,
  clearAllAlarms,
} = alarmSlice.actions;

export default alarmSlice.reducer;
