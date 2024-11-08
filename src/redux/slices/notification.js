import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import axios from "../../axios";


export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications',async (id) => {
    const { data } = await axios.get(`/notifications/${id}`)
    return data;
})

const initialState = {
        items: [],
        status: 'loading'
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: { },
    extraReducers:{
        ////Получение статей
        [fetchNotifications.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchNotifications.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.items = action.payload;
        },
        [fetchNotifications.rejected]: (state) => {
            state.status = 'error';
            state.items = [];
        },

    }
});
export const notificationReducer = notificationsSlice.reducer;