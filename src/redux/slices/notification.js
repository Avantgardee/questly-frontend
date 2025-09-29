import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from "../../axios";

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (id, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/notifications/${id}`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки уведомлений');
    }
});

const initialState = {
    items: [],
    status: 'loading',
    error: null
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearNotificationsError: (state) => {
            state.error = null;
        },
        removeInvalidNotifications: (state) => {
            state.items = state.items.filter(notif => notif.actionByUser !== null);
        }
    },
    extraReducers: {
        [fetchNotifications.pending]: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        [fetchNotifications.fulfilled]: (state, action) => {
            state.status = 'loaded';
            // Фильтруем уведомления с null actionByUser
            state.items = action.payload.filter(notif => notif.actionByUser !== null);
            state.error = null;
        },
        [fetchNotifications.rejected]: (state, action) => {
            state.status = 'error';
            state.items = [];
            state.error = action.payload;
        },
    }
});

export const { clearNotificationsError, removeInvalidNotifications } = notificationsSlice.actions;
export const notificationReducer = notificationsSlice.reducer;