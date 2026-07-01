import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/taskApi';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (params, { rejectWithValue }) => {
  try {
    const data = await taskApi.getAll(params);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/createTask', async (taskData, { rejectWithValue }) => {
  try {
    const data = await taskApi.create(taskData);
    return data.task;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await taskApi.update(id, data);
    return res.task;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id, { rejectWithValue }) => {
  try {
    await taskApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
  }
});

export const toggleTask = createAsyncThunk('tasks/toggleTask', async (id, { rejectWithValue }) => {
  try {
    const res = await taskApi.toggle(id);
    return res.task;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle task');
  }
});

const initialState = {
  tasks: [],
  total: 0,
  page: 1,
  pages: 1,
  stats: null,
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasks: (state) => { state.tasks = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        if (action.payload.stats) state.stats = action.payload.stats;
      })
      .addCase(fetchTasks.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.tasks.unshift(action.payload); state.total += 1; })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tasks[idx] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
        state.total -= 1;
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tasks[idx] = action.payload;
      });
  },
});

export const { clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
