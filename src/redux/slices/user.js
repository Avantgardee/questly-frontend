import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import axios from "../../axios";


export const fetchGetUser = createAsyncThunk('user/fetchGetUser', async (id) =>
{
    const { data } = await axios.get(`/user/${id}`);
    return data;
});



const initialState = {
    data: null,
    status: 'loading',
};


const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers:{
    },
    extraReducers:{
        //Получение выбранного пользователя
        [fetchGetUser.pending]: (state) => {
            state.status = 'loading';
            state.data = null;
        },
        [fetchGetUser.fulfilled]: (state, action) => {
            state.status = 'loaded';
            state.data = action.payload;
        },
        [fetchGetUser.rejected]: (state) => {
            state.status = 'error';
            state.data = null;
        },

    },
});



export const userReducer = userSlice.reducer
