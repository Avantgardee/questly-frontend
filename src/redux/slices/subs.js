import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "../../axios";

export const fetchGetSubs = createAsyncThunk('subs/fetchGetSubs', async (params) => {
    const { data } = await axios.get(`/profile/${params.id}/${params.group}`);
    return data;
});

export const fetchGetAllUser = createAsyncThunk('subs/fetchGetAllUser', async () => {
    const { data } = await axios.get(`/users`);
    return data;
});

const initialState = {
    items: [],
    filteredItems: [],
    status: 'loading',
};

const subsSlice = createSlice({
    name: 'subs',
    initialState,
    reducers: {
        filterSubs: (state, action) => {
            state.filteredItems = state.items.filter(user =>
                user.fullName.toLowerCase().includes(action.payload.toLowerCase()) ||
                user.email.toLowerCase().includes(action.payload.toLowerCase())
            );
        },
        resetFilter: (state) => {
            state.filteredItems = state.items;
        }
    },
    extraReducers: {
        [fetchGetSubs.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchGetSubs.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.items = action.payload;
            state.filteredItems = action.payload;
        },
        [fetchGetSubs.rejected]: (state) => {
            state.status = 'error';
            state.items = [];
            state.filteredItems = [];
        },
        [fetchGetAllUser.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchGetAllUser.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.items = action.payload;
            state.filteredItems = action.payload;
        },
        [fetchGetAllUser.rejected]: (state) => {
            state.status = 'error';
            state.items = [];
            state.filteredItems = [];
        },
    }
});

export const { filterSubs, resetFilter } = subsSlice.actions;
export const subsReducer = subsSlice.reducer;
