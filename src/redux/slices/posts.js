import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import axios from "../../axios";


export const fetchPosts = createAsyncThunk('posts/fetchPosts',async ({ page = 1, limit = 10, append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get('/posts', { params: { page, limit } });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки постов');
    }
})

export const fetchPostsWithUser = createAsyncThunk('posts/fetchPostsWithUser',async ({ user, page = 1, limit = 10, append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/posts/user/${user}`, { params: { page, limit } });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки постов');
    }
})

export const fetchPostsWithTag = createAsyncThunk('posts/fetchPostsWithTag',async ({ tag, page = 1, limit = 10, append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/tags/${tag}`, { params: { page, limit } });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки постов');
    }
})

export const fetchPostsWithFilter = createAsyncThunk('posts/fetchPostsWithFilter',async ({ filter, direction, search, page = 1, limit = 10, append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/posts/sort/${filter}/${direction}/${search || ''}`, { params: { page, limit } });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки постов');
    }
})

export const fetchPostsWithFilterAndSubs = createAsyncThunk('posts/fetchPostsWithFilterAndSubs',async ({ filter, direction, search, page = 1, limit = 10, append = false }, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/posts/sortWithSubscriptions/${filter}/${direction}/${search || ''}`, { params: { page, limit } });
        return { ...data, append };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки постов');
    }
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
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasMore: false
        },
        loadingMore: false
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
        [fetchPosts.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.posts.loadingMore = true;
            } else {
                state.posts.status = 'loading';
            }
        },
        [fetchPosts.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.loadingMore = false;
            if (action.payload.append) {
                state.posts.items = [...state.posts.items, ...action.payload.posts];
            } else {
                state.posts.items = action.payload.posts;
            }
            state.posts.pagination = action.payload.pagination;
        },
        [fetchPosts.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.loadingMore = false;
            state.posts.items = [];
        },
        ////Cтатьи c параметрами
        [fetchPostsWithFilter.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.posts.loadingMore = true;
            } else {
                state.posts.status = 'loading';
            }
        },
        [fetchPostsWithFilter.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.loadingMore = false;
            if (action.payload.append) {
                state.posts.items = [...state.posts.items, ...action.payload.posts];
            } else {
                state.posts.items = action.payload.posts;
            }
            state.posts.pagination = action.payload.pagination;
        },
        [fetchPostsWithFilter.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.loadingMore = false;
            state.posts.items = [];
        },
        ////Cтатьи c параметрами и только подписки
        [fetchPostsWithFilterAndSubs.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.posts.loadingMore = true;
            } else {
                state.posts.status = 'loading';
            }
        },
        [fetchPostsWithFilterAndSubs.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.loadingMore = false;
            if (action.payload.append) {
                state.posts.items = [...state.posts.items, ...action.payload.posts];
            } else {
                state.posts.items = action.payload.posts;
            }
            state.posts.pagination = action.payload.pagination;
        },
        [fetchPostsWithFilterAndSubs.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.loadingMore = false;
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
        //Получение статей с тегом
        [fetchPostsWithTag.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.posts.loadingMore = true;
            } else {
                state.posts.status = 'loading';
            }
        },
        [fetchPostsWithTag.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.loadingMore = false;
            if (action.payload.append) {
                state.posts.items = [...state.posts.items, ...action.payload.posts];
            } else {
                state.posts.items = action.payload.posts;
            }
            state.posts.pagination = action.payload.pagination;
        },
        [fetchPostsWithTag.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.loadingMore = false;
            state.posts.items = [];
        },
        //Получение статей по выбранному пользователю
        [fetchPostsWithUser.pending]: (state, action) => {
            if (action.meta.arg.append) {
                state.posts.loadingMore = true;
            } else {
                state.posts.status = 'loading';
            }
        },
        [fetchPostsWithUser.fulfilled]: (state, action) => {
            state.posts.status = 'loaded';
            state.posts.loadingMore = false;
            if (action.payload.append) {
                state.posts.items = [...state.posts.items, ...action.payload.posts];
            } else {
                state.posts.items = action.payload.posts;
            }
            state.posts.pagination = action.payload.pagination;
        },
        [fetchPostsWithUser.rejected]: (state) => {
            state.posts.status = 'error';
            state.posts.loadingMore = false;
            state.posts.items = [];
        },
    }
});
export const { filterByComments, filterByViews, filterByCreatedAt, filterByTitle } = postsSlice.actions;
export const postsReducer = postsSlice.reducer;