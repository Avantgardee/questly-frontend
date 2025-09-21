import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../axios';

export const fetchChats = createAsyncThunk('messages/fetchChats', async (_, { rejectWithValue, getState }) => {
    try {
        const { data } = await axios.get('/chats');
        const currentUserId = getState().auth.data._id;
        const chats = data.map(chat => ({
            ...chat,
            unreadCount: chat.unreadCount[currentUserId] || 0,
        }));
        return chats;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки чатов');
    }
});

export const createChat = createAsyncThunk('messages/createChat', async (participantId, { rejectWithValue, getState }) => {
    try {
        const { data } = await axios.post('/chats/create', { participantId });
        const currentUserId = getState().auth.data._id;
        data.unreadCount = data.unreadCount[currentUserId] || 0;
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка создания чата');
    }
});

export const fetchChatMessages = createAsyncThunk('messages/fetchChatMessages', async (chatId, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`/chats/${chatId}/messages`);
        return { chatId, messages: data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки сообщений');
    }
});

export const sendMessage = createAsyncThunk('messages/sendMessage', async ({ chatId, text, attachments }, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/messages/send', { chatId, text, attachments });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка отправки сообщения');
    }
});

export const deleteMessage = createAsyncThunk('messages/deleteMessage', async (messageId, { rejectWithValue }) => {
    try {
        const { data } = await axios.delete(`/messages/${messageId}`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка удаления сообщения');
    }
});

export const deleteChat = createAsyncThunk('messages/deleteChat', async (chatId, { rejectWithValue }) => {
    try {
        const { data } = await axios.delete(`/chats/${chatId}`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка удаления чата');
    }
});

export const clearChat = createAsyncThunk('messages/clearChat', async (chatId, { rejectWithValue }) => {
    try {
        const { data } = await axios.delete(`/chats/${chatId}/clear`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка очистки чата');
    }
});

export const editMessage = createAsyncThunk('messages/editMessage', async ({ messageId, text }, { rejectWithValue }) => {
    try {
        const { data } = await axios.patch(`/messages/${messageId}`, { text });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка редактирования сообщения');
    }
});

export const uploadMessageFiles = createAsyncThunk('messages/uploadFiles', async (files, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        const { data } = await axios.post('/messages/upload-files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.fileUrls;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки файлов');
    }
});

const initialState = {
    chats: [],
    currentChat: null,
    messages: [],
    status: 'idle',
    error: null,
    uploadStatus: 'idle'
};

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            const { message: newMessage, chat: updatedChatData, currentUserId } = action.payload;

            if (state.currentChat?._id === newMessage.chat) {
                if (!state.messages.some(msg => msg._id === newMessage._id)) {
                    state.messages.push(newMessage);
                }
            }
            const chatIndex = state.chats.findIndex(chat => chat._id === newMessage.chat);

            if (chatIndex !== -1) {
                const existingChat = state.chats[chatIndex];
                existingChat.lastMessage = newMessage;

                if (state.currentChat?._id !== newMessage.chat) {
                    if (updatedChatData && updatedChatData.unreadCount && currentUserId) {
                        existingChat.unreadCount = updatedChatData.unreadCount[currentUserId] || 0;
                    }
                } else {
                    existingChat.unreadCount = 0;
                }

                state.chats.splice(chatIndex, 1);
                state.chats.unshift(existingChat);

            } else {
                if (updatedChatData && currentUserId) {
                    const newChat = {
                        ...updatedChatData,
                        unreadCount: state.currentChat?._id === newMessage.chat ? 0 : (updatedChatData.unreadCount[currentUserId] || 0),
                        lastMessage: newMessage,
                    };
                    state.chats.unshift(newChat);
                }
            }
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            const message = state.messages.find(m => m._id === messageId);
            if (message) {
                message.status = status;
            }
            const chat = state.chats.find(c => c.lastMessage?._id === messageId);
            if (chat?.lastMessage) {
                chat.lastMessage.status = status;
            }
        },
        setCurrentChat: (state, action) => {
            state.currentChat = action.payload;
            state.messages = [];

            if (action.payload) {
                const chatInList = state.chats.find(c => c._id === action.payload._id);
                if (chatInList) {
                    chatInList.unreadCount = 0;
                }
            }
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter(msg => msg._id !== action.payload);
        },
        updateMessage: (state, action) => {
            const index = state.messages.findIndex(msg => msg._id === action.payload._id);
            if (index !== -1) {
                state.messages[index] = action.payload;
            }
        },
        removeChat: (state, action) => {
            state.chats = state.chats.filter(chat => chat._id !== action.payload);
            if (state.currentChat?._id === action.payload) {
                state.currentChat = null;
                state.messages = [];
            }
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChats.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchChats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.chats = action.payload;
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createChat.fulfilled, (state, action) => {
                if (!state.chats.some(chat => chat._id === action.payload._id)) {
                    state.chats.unshift(action.payload);
                }
                state.currentChat = action.payload;
                state.messages = [];
            })
            .addCase(fetchChatMessages.fulfilled, (state, action) => {
                state.messages = action.payload.messages;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                if (!state.messages.some(msg => msg._id === action.payload._id)) {
                    state.messages.push(action.payload);
                }
                const chatIndex = state.chats.findIndex(chat => chat._id === action.payload.chat);
                if (chatIndex !== -1) { state.chats[chatIndex].lastMessage = action.payload; }
            })
            .addCase(uploadMessageFiles.pending, (state) => { state.uploadStatus = 'loading'; })
            .addCase(uploadMessageFiles.fulfilled, (state) => { state.uploadStatus = 'succeeded'; })
            .addCase(uploadMessageFiles.rejected, (state, action) => {
                state.uploadStatus = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteMessage.fulfilled, (state, action) => {
                state.messages = state.messages.filter(msg => msg._id !== action.meta.arg);
            })
            .addCase(deleteChat.fulfilled, (state, action) => {
                state.chats = state.chats.filter(chat => chat._id !== action.meta.arg);
                if (state.currentChat?._id === action.meta.arg) {
                    state.currentChat = null;
                    state.messages = [];
                }
            })
            .addCase(clearChat.fulfilled, (state, action) => {
                if (state.currentChat?._id === action.meta.arg) {
                    state.messages = [];
                }
            })
            .addCase(editMessage.fulfilled, (state, action) => {
                const index = state.messages.findIndex(msg => msg._id === action.payload._id);
                if (index !== -1) { state.messages[index] = action.payload; }
            });
    }
});

export const {
    setCurrentChat, addMessage, updateMessageStatus, clearError, removeMessage,
    updateMessage, removeChat
} = messagesSlice.actions;
export default messagesSlice.reducer;