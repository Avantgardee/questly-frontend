import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from "../../axios";

export const fetchAuth = createAsyncThunk('auth/fetchAuth', async (params, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/auth/login', params);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка авторизации');
    }
});

export const fetchRegisterData = createAsyncThunk('auth/fetchRegisterData', async (params, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/auth/register/data', params);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка регистрации');
    }
});

export const fetchRegisterImage = createAsyncThunk('auth/fetchRegisterImage', async (params, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/auth/register/image', params);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки изображения');
    }
});

export const fetchAuthMe = createAsyncThunk('auth/fetchAuthMe', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axios.get('/auth/me');
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка проверки авторизации');
    }
});

export const fetchLogout = createAsyncThunk('auth/fetchLogout', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/auth/logout');
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка выхода');
    }
});

const initialState = {
    data: null,
    status: 'loading',
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.data = null;
            state.status = 'loaded';
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: {
        [fetchAuth.pending]: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        [fetchAuth.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
            state.error = null;
        },
        [fetchAuth.rejected]: (state, action) => {
            state.status = 'error';
            state.data = null;
            state.error = action.payload;
        },
        [fetchAuthMe.pending]: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        [fetchAuthMe.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
            state.error = null;
        },
        [fetchAuthMe.rejected]: (state, action) => {
            state.status = 'error';
            state.data = null;
            state.error = action.payload;
        },
        [fetchRegisterData.pending]: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        [fetchRegisterData.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
            state.error = null;
        },
        [fetchRegisterData.rejected]: (state, action) => {
            state.status = 'error';
            state.data = null;
            state.error = action.payload;
        },
        [fetchRegisterImage.pending]: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        [fetchRegisterImage.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = {
                ...state.data,
                ...action.payload,
            };
            state.error = null;
        },
        [fetchRegisterImage.rejected]: (state, action) => {
            state.status = 'error';
            state.data = null;
            state.error = action.payload;
        },
        [fetchLogout.fulfilled]: (state) => {
            state.data = null;
            state.status = 'loaded';
            state.error = null;
        },
        [fetchLogout.rejected]: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const selectIsAuth = (state) => Boolean(state.auth.data);
export const selectAuthError = (state) => state.auth.error;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsUserLoading = (state) => state.auth.status === 'loading';
export const selectUserData = (state) => state.auth.data;
export const authReducer = authSlice.reducer;
export const { logout, clearError } = authSlice.actions;