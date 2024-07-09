import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import axios from "../../axios";


export const fetchPosts = createAsyncThunk('posts/fetchPosts',async () => {
const { data } = await axios.get('/posts')
    return data;
})

export const fetchPostsWithUser = createAsyncThunk('posts/fetchPostsWithUser',async (user) => {
    const { data } = await axios.get(`/posts/user/${user}`)
    return data;
})

export const fetchPostsWithTag = createAsyncThunk('posts/fetchPosts',async (tag) => {
    const { data } = await axios.get(`/tags/${tag}`)
    return data;
})

export const fetchPostsWithFilter = createAsyncThunk('posts/fetchPostsWithFilter',async (params) => {
    const { data } = await axios.get(`/posts/sort/${params.filter}/${params.direction}/${params.search}`);

    return data;
})
export const fetchPostsWithFilterAndSubs = createAsyncThunk('posts/fetchPostsWithFilterAndSubs',async (params) => {
    const { data } = await axios.get(`/posts/sortWithSubscriptions/${params.filter}/${params.direction}/${params.search}`);

    return data;
})

export const fetchTags = createAsyncThunk('posts/fetchTags',async () => {
    const { data } = await axios.get('/tags')
    return data;
})

export const fetchRemovePost = createAsyncThunk('posts/fetchRemovePost',async (id) => {
    axios.delete(`/posts/${id}`);
})
const initialState = {
    posts: {
        items: [],
        status: 'loading',
        allItems:[],
    },
    tags: {
        items: [],
        status: 'loading',
    },
};

const postsSlice = createSlice({
    name: 'posts',
    initialState,
        reducers: {
            filterByComments: (state, action) => {
                const direction = action.payload;
                state.posts.items.sort((a, b) =>
                    direction === 'asc'
                        ? a.comments.length - b.comments.length
                        : b.comments.length - a.comments.length
                );
            },
            filterByViews: (state, action) => {
                const direction = action.payload;
                state.posts.items.sort((a, b) =>
                    direction === 'asc'
                        ? a.viewsCount - b.viewsCount
                        : b.viewsCount - a.viewsCount
                );
            },
            filterByCreatedAt: (state, action) => {
                const direction = action.payload;
                state.posts.items.sort((a, b) =>
                    direction === 'asc'
                        ? new Date(a.createdAt) - new Date(b.createdAt)
                        : new Date(b.createdAt) - new Date(a.createdAt)
                );
            },
            filterByTitle: (state, action) => {
                const query = action.payload.toLowerCase();
                if (query) {
                    // Сохраняем оригинальный массив данных
                    if (state.posts.allItems.length === 0) {
                        state.posts.allItems = state.posts.items;
                    }
                    // Фильтруем массив
                    state.posts.items = state.posts.allItems.filter(post =>
                        post.title.toLowerCase().includes(query)
                    );
                } else {
                    // Если запрос пустой, восстанавливаем оригинальный массив
                    state.posts.items = state.posts.allItems;
                    state.posts.allItems = []; // Очищаем сохраненный массив
                }
            }
        },
    extraReducers:{
        ////Получение статей
        [fetchPosts.pending]: (state) => {
            state.posts.status = 'loading';
        },
        [fetchPosts.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.items = action.payload;
        },
        [fetchPosts.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.items = [];
        },
        ////Cтатьи c параметрами
        [fetchPostsWithFilter.pending]: (state) => {
            state.posts.status = 'loading';
        },
        [fetchPostsWithFilter.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.items = action.payload;
        },
        [fetchPostsWithFilter.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.items = [];
        },
        ////Cтатьи c параметрами и только подписки
        [fetchPostsWithFilterAndSubs.pending]: (state) => {
            state.posts.status = 'loading';
        },
        [fetchPostsWithFilterAndSubs.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.items = action.payload;
        },
        [fetchPostsWithFilterAndSubs.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.items = [];
        },
        ///ТЕГИ
        [fetchTags.pending]: (state) => {
            state.tags.status = 'loading';
        },
        [fetchTags.fulfilled]: (state, action) => {
            state.tags.status = 'loaded';
            state.tags.items = action.payload;
        },
        [fetchTags.rejected]: (state) => {
            state.tags.status = 'error';
            state.tags.items = [];
        },
        //УДАЛЕНИЕ
        [fetchRemovePost.pending]: (state, action) => {
            state.posts.items = state.posts.items.filter((item) => item._id !== action.meta.arg);
        },
        //Получние статей с тегом
        [fetchPostsWithFilter.pending]: (state) => {
            state.posts.status = 'loading';
        },
        [fetchPostsWithFilter.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.items = action.payload;
        },
        [fetchPostsWithFilter.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.items = [];
        },
        //Получение статей по выбранному пользователю

        [fetchPostsWithUser.pending]: (state) => {
            state.posts.status = 'loading';
        },
        [fetchPostsWithUser.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.items = action.payload;
        },
        [fetchPostsWithUser.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.items = [];
        },
    }
});
export const { filterByComments, filterByViews, filterByCreatedAt, filterByTitle } = postsSlice.actions;
export const postsReducer = postsSlice.reducer;