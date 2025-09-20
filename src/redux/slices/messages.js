import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../axios';

// Thunks остаются без изменений
export const fetchChats = createAsyncThunk('messages/fetchChats', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axios.get('/chats');
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки чатов');
    }
});

export const createChat = createAsyncThunk('messages/createChat', async (participantId, { rejectWithValue }) => {
    try {
        const { data } = await axios.post('/chats/create', { participantId });
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
        // ИЗМЕНЕНИЕ: Логика обновления чатов и счетчика непрочитанных
        addMessage: (state, action) => {
            const newMessage = action.payload;
            const isMyMessage = state.auth?.data?._id === newMessage.sender._id; // Предполагая, что auth state доступен

            // 1. Логика для массива сообщений (только если чат открыт)
            if (state.currentChat?._id === newMessage.chat) {
                if (!state.messages.some(msg => msg._id === newMessage._id)) {
                    state.messages.push(newMessage);
                }
            }

            // 2. Логика для списка чатов (выполняется всегда)
            const chatIndex = state.chats.findIndex(chat => chat._id === newMessage.chat);
            if (chatIndex !== -1) {
                const updatedChat = state.chats[chatIndex];
                updatedChat.lastMessage = newMessage; // Обновляем последнее сообщение

                // Увеличиваем счетчик непрочитанных, если сообщение не мое и чат не активен
                if (!isMyMessage && state.currentChat?._id !== newMessage.chat) {
                    updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
                }

                // Перемещаем чат наверх списка
                state.chats.splice(chatIndex, 1);
                state.chats.unshift(updatedChat);
            }
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            const message = state.messages.find(m => m._id === messageId);
            if (message) {
                message.status = status;
            }
            // Обновляем статус и в списке чатов
            const chat = state.chats.find(c => c.lastMessage?._id === messageId);
            if (chat?.lastMessage) {
                chat.lastMessage.status = status;
            }
        },
        setCurrentChat: (state, action) => {
            state.currentChat = action.payload;
            state.messages = []; // Очищаем сообщения при смене чата

            // ИЗМЕНЕНИЕ: Обнуляем счетчик непрочитанных при открытии чата
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
                // ИЗМЕНЕНИЕ: Инициализируем счетчик непрочитанных
                state.chats = action.payload.map(chat => ({ ...chat, unreadCount: 0 }));
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createChat.fulfilled, (state, action) => {
                if (!state.chats.some(chat => chat._id === action.payload._id)) {
                    // ИЗМЕНЕНИЕ: Инициализируем счетчик непрочитанных
                    state.chats.unshift({ ...action.payload, unreadCount: 0 });
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