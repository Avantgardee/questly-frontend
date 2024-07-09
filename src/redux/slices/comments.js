import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "../../axios";

const initialState = {
    comments: [],
    loading: false,
};

export const fetchCreateComment = createAsyncThunk(
    'comment/fetchCreateComment',
    async ({ postId, text }) => {
        try {
            console.log('Sending data to server:', { postId, text });
            const response = await axios.post(`/comments/${postId}`, {
                text,
            });
            return response.data;
        } catch (e) {
            console.error('Error creating comment', e);
            throw e;
        }
    },
);

export const fetchGetPostComments = createAsyncThunk('comment/fetchGetPostComments', async (postId) =>
{
    try{
        const { data } = await axios.get(`/posts/comments/${postId}`);
        return data;
    }
    catch (e) {
        console.error(e);
    }
})



export const commentsSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {},
    extraReducers: {
        // отправка комментариев
        [fetchCreateComment.pending]: (state) => {
            state.loading = true;
        },
        [fetchCreateComment.fulfilled]: (state, action) => {
            state.loading = false;
            state.comments.push(action.payload);
        },
        [fetchCreateComment.rejected]: (state) => {
            state.loading = false;
        },

        // получние комментариев
        [fetchGetPostComments.pending]: (state) => {
            state.loading = true;
        },
        [fetchGetPostComments.fulfilled]: (state, action) => {
            state.loading = false;
            state.comments = action.payload;
        },
        [fetchGetPostComments.rejected]: (state) => {
            state.loading = false;
        },
    }
});

export const commentReducer = commentsSlice.reducer;
