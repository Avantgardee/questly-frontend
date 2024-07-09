import {configureStore} from '@reduxjs/toolkit'
import {postsReducer} from "./slices/posts";
import {authReducer} from "./slices/auth";
import {commentReducer} from "./slices/comments";
import {userReducer} from "./slices/user";
import {subsReducer} from "./slices/subs";

const store = configureStore({
    reducer: {
        posts: postsReducer,
        auth: authReducer,
        comment: commentReducer,
        user: userReducer,
        subs: subsReducer,
    },
});

export default store;