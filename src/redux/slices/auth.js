import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import axios from "../../axios";


export const fetchAuth = createAsyncThunk('auth/fetchAuth', async (params) =>
{
    const { data } = await axios.post('/auth/login', params);

    return data;
});

export const fetchRegisterData = createAsyncThunk('auth/fetchRegisterData', async (params) =>
{
    const { data } = await axios.post('/auth/register/data', params);
    return data;
});

export const fetchRegisterImage = createAsyncThunk('auth/fetchRegisterImage', async (params) =>
{
    const { data } = await axios.post('/auth/register/image', params);
    return data;
});

export const fetchAuthMe = createAsyncThunk('auth/fetchAuthMe', async () =>
{
    const { data } = await axios.get('/auth/me');
    return data;
});




const initialState = {
    data: null,
    status: 'loading',
};
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers:{
        logout:(state) =>{
            state.data = null;
        }
    },
    extraReducers:{
        //Вход в аккаунт
        [fetchAuth.pending]: (state) => {
            state.status = 'loading';
            state.data = null;
        },
        [fetchAuth.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
        },
        [fetchAuth.rejected]: (state) => {
            state.status = 'error';
            state.data = null;
        },
        //Получение данных о пользователе
        [fetchAuthMe.pending]: (state) => {
            state.status = 'loading';
            state.data = null;
        },
        [fetchAuthMe.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
        },
        [fetchAuthMe.rejected]: (state) => {
            state.status = 'error';
            state.data = null;
        },
        //Отправка данных на регистрацию
        [fetchRegisterData.pending]: (state) => {
            state.status = 'loading';
            state.data = null;
        },
        [fetchRegisterData.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
        },
        [fetchRegisterData.rejected]: (state) => {
            state.status = 'error';
            state.data = null;
        },
        //Отправка фото на регистрацию
        [fetchRegisterImage.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchRegisterImage.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = {
            ...state.data,
            ...action.payload, // Добавление новых свойств или обновление существующих свойств объекта
            };
        },
        [fetchRegisterImage.rejected]: (state) => {
            state.status = 'error';
            state.data = null;
        },

    },
});

export const selectIsAuth = (state) => Boolean(state.auth.data)

export const authReducer = authSlice.reducer
export const { logout } = authSlice.actions;