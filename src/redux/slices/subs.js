import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "../../axios";

export const fetchGetSubs = createAsyncThunk('subs/fetchGetSubs', async ({ id, group, page = 1, limit = 10, search = '', append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/profile/${id}/${group}`, { 
            params: { page, limit, search } 
        });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки подписчиков');
    }
});

export const fetchGetSubscriptions = createAsyncThunk('subs/fetchGetSubscriptions', async (params, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/profile/${params.id}/subscriptions`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки подписок');
    }
});

export const fetchGetAllUser = createAsyncThunk('subs/fetchGetAllUser', async ({ page = 1, limit = 10, search = '', append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/users`, { 
            params: { page, limit, search } 
        });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователей');
    }
});

const initialState = {
    items: [],
    filteredItems: [],
    status: 'loading',
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false
    },
    loadingMore: false,
    searchQuery: ''
};

const subsSlice = createSlice({
    name: 'subs',
    initialState,
    reducers: {
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        resetFilter: (state) => {
            state.filteredItems = state.items;
            state.searchQuery = '';
        }
    },
    extraReducers: {
        [fetchGetSubs.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.loadingMore = true;
            } else {
                state.status = 'loading';
            }
        },
        [fetchGetSubs.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.loadingMore = false;
            if (action.payload.append) {
                state.items = [...state.items, ...action.payload.users];
                state.filteredItems = [...state.filteredItems, ...action.payload.users];
            } else {
                state.items = action.payload.users;
                state.filteredItems = action.payload.users;
            }
            state.pagination = action.payload.pagination;
        },
        [fetchGetSubs.rejected]: (state) => {
            state.status = 'error';
            state.loadingMore = false;
            state.items = [];
            state.filteredItems = [];
        },
        [fetchGetSubscriptions.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchGetSubscriptions.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.items = action.payload;
            state.filteredItems = action.payload;
        },
        [fetchGetSubscriptions.rejected]: (state) => {
            state.status = 'error';
            state.items = [];
            state.filteredItems = [];
        },
        [fetchGetAllUser.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.loadingMore = true;
            } else {
                state.status = 'loading';
            }
        },
        [fetchGetAllUser.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.loadingMore = false;
            if (action.payload.append) {
                state.items = [...state.items, ...action.payload.users];
                state.filteredItems = [...state.filteredItems, ...action.payload.users];
            } else {
                state.items = action.payload.users;
                state.filteredItems = action.payload.users;
            }
            state.pagination = action.payload.pagination;
        },
        [fetchGetAllUser.rejected]: (state) => {
            state.status = 'error';
            state.loadingMore = false;
            state.items = [];
            state.filteredItems = [];
        },
    }
});

export const { setSearchQuery, resetFilter } = subsSlice.actions;
export const subsReducer = subsSlice.reducer;