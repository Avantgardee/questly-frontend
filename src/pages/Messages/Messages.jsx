import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Grid, Paper, TextField, Button, List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Typography, IconButton, Box, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, ListItemButton, InputAdornment, CircularProgress, Badge,
    ImageList, ImageListItem, Card, CardMedia, CardContent, CardActionArea, Menu, MenuItem
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon, Search as SearchIcon, Add as AddIcon, Done, DoneAll, Folder as FolderIcon, Download as DownloadIcon, Edit as EditIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
    fetchChatMessages, fetchChats, createChat, uploadMessageFiles, addMessage,
    updateMessageStatus, setCurrentChat, fetchChatFiles, updateMessage, removeMessage,
    updateChatUnreadCount
} from "../../redux/slices/messages";
import { fetchGetSubs } from "../../redux/slices/subs";
import { webSocketService } from "../../services/websocket";
import { selectIsAuth } from "../../redux/slices/auth";
import axios from '../../axios';

const Messages = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuth = useSelector(selectIsAuth);
    const { chats, messages, currentChat, status: chatsStatus, chatFiles, filesStatus } = useSelector(state => state.messages);
    const userData = useSelector(state => state.auth.data);
    const { items: subscribers, status: subsStatus } = useSelector(state => state.subs);

    const [messageText, setMessageText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [openNewChatDialog, setOpenNewChatDialog] = useState(false);
    const [openFilesDialog, setOpenFilesDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedMessage, setHighlightedMessage] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const currentChatRef = useRef(currentChat);
    const userDataRef = useRef(userData);

    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    useEffect(() => {
        userDataRef.current = userData;
    }, [userData]);

    useEffect(() => {
        if (!isAuth || !userData?._id) {
            if (isAuth) return;
            navigate('/login');
            return;
        }

        dispatch(fetchChats());
        dispatch(fetchGetSubs({ id: userData._id, group: 'subscribers' }));
        
        // При монтировании компонента перезагружаем сообщения для открытого чата
        // Это гарантирует получение всех сообщений, пришедших во время отсутствия
        if (currentChat?._id) {
            dispatch(fetchChatMessages(currentChat._id)).then(() => {
                // После загрузки сообщений отмечаем чат как прочитанный, если есть непрочитанные
                if (currentChat.unreadCount > 0) {
                    webSocketService.markChatAsRead(currentChat._id);
                    dispatch(fetchChats());
                }
            });
            lastLoadedChatRef.current = currentChat._id;
        }

        const handleWebSocketMessage = (message) => {
            const activeChat = currentChatRef.current;
            const currentUser = userDataRef.current;

            switch (message.type) {
                case 'NEW_MESSAGE': {
                    const newMessage = message.data.message;
                    const isMyMessage = newMessage.sender._id === currentUser?._id;
                    const isCurrentChat = newMessage.chat === activeChat?._id;
                    
                    // Всегда добавляем сообщение в состояние (обновляет список чатов)
                    dispatch(addMessage({ ...message.data, currentUserId: currentUser?._id }));

                    if (!isMyMessage && isCurrentChat) {
                        webSocketService.markMessageAsRead(newMessage._id);
                        webSocketService.markChatAsRead(newMessage.chat);
                    } else if (!isMyMessage && !isCurrentChat) {
                        webSocketService.sendMessage({ type: 'MESSAGE_DELIVERED', data: { messageId: newMessage._id } });
                    }
                    break;
                }
                case 'MESSAGE_DELIVERED':
                    dispatch(updateMessageStatus({
                        messageId: message.data.messageId,
                        status: 'delivered'
                    }));
                    break;
                case 'MESSAGE_READ':
                    dispatch(updateMessageStatus({
                        messageId: message.data.messageId,
                        status: 'read'
                    }));
                    break;
                case 'CHAT_MARKED_AS_READ':
                    console.log('Chat marked as read confirmed by server:', message.data);
                    // Обновляем unreadCount в списке чатов
                    if (message.data.userId === currentUser?._id) {
                        dispatch(updateChatUnreadCount({ chatId: message.data.chatId, unreadCount: 0 }));
                    }
                    break;
                case 'MESSAGE_EDITED':
                    dispatch(updateMessage(message.data.message));
                    break;
                case 'MESSAGE_DELETED': {
                    dispatch(removeMessage(message.data.messageId));
                    // Обновляем список чатов, чтобы обновить lastMessage
                    if (message.data.chat || message.data.chatId) {
                        // Если есть новое последнее сообщение, обновляем через addMessage
                        if (message.data.chat?.lastMessage) {
                            dispatch(addMessage({
                                message: message.data.chat.lastMessage,
                                chat: message.data.chat,
                                currentUserId: currentUser?._id
                            }));
                        } else {
                            // Если последнего сообщения нет или нет информации о чате, обновляем список
                            dispatch(fetchChats());
                        }
                    }
                    break;
                }
                default:
                    break;
            }
        };

        const fetchWsTokenAndConnect = async () => {
            try {
                const response = await axios.get('/auth/ws-token');
                if (response.data.wsToken) {
                    // Проверяем состояние WebSocket
                    const isConnected = webSocketService.isConnected();
                    
                    if (!isConnected) {
                        // Если не подключен, подключаемся
                        webSocketService.connect(response.data.wsToken);
                    } else {
                        // Если уже подключен, просто убеждаемся, что обработчик добавлен
                        console.log('WebSocket already connected, adding handler');
                    }
                    
                    // Всегда добавляем обработчик (он будет удален в cleanup)
                    webSocketService.addMessageHandler(handleWebSocketMessage);
                }
            } catch (error) {
                console.error('Error fetching WebSocket token:', error);
            }
        };

        fetchWsTokenAndConnect();

        return () => {
            // Удаляем только обработчик, но НЕ отключаем WebSocket
            // WebSocket должен оставаться подключенным, так как он используется глобально
            webSocketService.removeMessageHandler(handleWebSocketMessage);
        };
    }, [dispatch, isAuth, navigate, userData?._id]);

    // При возврате на страницу перезагружаем сообщения для открытого чата
    // Используем useRef для отслеживания последнего загруженного чата
    const lastLoadedChatRef = useRef(null);
    const locationRef = useRef(location.pathname);
    
    // Отслеживаем изменения location для перезагрузки при возврате через историю браузера
    useEffect(() => {
        const currentPath = location.pathname;
        const previousPath = locationRef.current;
        
        // Если вернулись на страницу сообщений (например, через историю браузера)
        if (currentPath === '/messages' && previousPath !== currentPath && currentChat?._id && isAuth && userData?._id) {
            // Перезагружаем сообщения для открытого чата
            dispatch(fetchChatMessages(currentChat._id));
            lastLoadedChatRef.current = currentChat._id;
        }
        
        locationRef.current = currentPath;
    }, [location.pathname, currentChat?._id, isAuth, userData?._id, dispatch]);
    
    // Обрабатываем событие popstate (навигация через историю браузера)
    useEffect(() => {
        const handlePopState = () => {
            // При возврате через историю браузера перезагружаем сообщения для открытого чата
            if (currentChat?._id && isAuth && userData?._id && location.pathname === '/messages') {
                setTimeout(() => {
                    dispatch(fetchChatMessages(currentChat._id)).then(() => {
                        // После загрузки сообщений отмечаем чат как прочитанный
                        if (currentChat.unreadCount > 0) {
                            webSocketService.markChatAsRead(currentChat._id);
                            dispatch(fetchChats());
                        }
                    });
                    lastLoadedChatRef.current = currentChat._id;
                }, 100);
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [currentChat?._id, currentChat?.unreadCount, isAuth, userData?._id, location.pathname, dispatch]);
    
    // Отслеживаем видимость страницы и focus для перезагрузки при возврате
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && currentChat?._id && isAuth && userData?._id) {
                // При возврате на страницу перезагружаем сообщения
                dispatch(fetchChatMessages(currentChat._id)).then(() => {
                    // После загрузки сообщений отмечаем их как прочитанные
                    // и обновляем unreadCount
                    if (currentChat.unreadCount > 0) {
                        webSocketService.markChatAsRead(currentChat._id);
                        dispatch(fetchChats());
                    }
                });
                lastLoadedChatRef.current = currentChat._id;
            }
        };
        
        const handleFocus = () => {
            if (currentChat?._id && isAuth && userData?._id) {
                // При возврате фокуса на окно перезагружаем сообщения
                dispatch(fetchChatMessages(currentChat._id)).then(() => {
                    // После загрузки сообщений отмечаем их как прочитанные
                    if (currentChat.unreadCount > 0) {
                        webSocketService.markChatAsRead(currentChat._id);
                        dispatch(fetchChats());
                    }
                });
                lastLoadedChatRef.current = currentChat._id;
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [currentChat?._id, currentChat?.unreadCount, isAuth, userData?._id, dispatch]);
    
    useEffect(() => {
        if (currentChat?._id && isAuth && userData?._id) {
            // Загружаем сообщения если это новый чат или массив пуст
            if (lastLoadedChatRef.current !== currentChat._id || messages.length === 0) {
                dispatch(fetchChatMessages(currentChat._id)).then(() => {
                    // После загрузки сообщений отмечаем чат как прочитанный, если есть непрочитанные
                    if (currentChat.unreadCount > 0) {
                        webSocketService.markChatAsRead(currentChat._id);
                        dispatch(fetchChats());
                    }
                });
                lastLoadedChatRef.current = currentChat._id;
            }
        } else if (!currentChat) {
            // Очищаем флаг при закрытии чата
            lastLoadedChatRef.current = null;
        }
    }, [currentChat?._id, currentChat?.unreadCount, isAuth, userData?._id, dispatch]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const chatId = params.get('chatId');
        const messageId = params.get('messageId');

        if (chatId && chatsStatus === 'succeeded') {
            const targetChat = chats.find(c => c._id === chatId);
            if (targetChat && currentChat?._id !== chatId) {
                handleChatSelect(targetChat);
            }
            if (messageId) {
                setHighlightedMessage(messageId);
            }
        }
    }, [location.search, chatsStatus, chats]);
    
    // Перезагружаем сообщения для открытого чата после загрузки списка чатов
    // Это нужно для случаев, когда пользователь возвращается на страницу через историю браузера
    useEffect(() => {
        if (chatsStatus === 'succeeded' && currentChat?._id && isAuth && userData?._id) {
            // Проверяем, что чат все еще существует в списке
            const chatExists = chats.some(c => c._id === currentChat._id);
            if (chatExists && lastLoadedChatRef.current !== currentChat._id) {
                // Перезагружаем сообщения, если они еще не загружены
                const chat = chats.find(c => c._id === currentChat._id);
                dispatch(fetchChatMessages(currentChat._id)).then(() => {
                    // После загрузки сообщений отмечаем чат как прочитанный, если есть непрочитанные
                    if (chat && chat.unreadCount > 0) {
                        webSocketService.markChatAsRead(currentChat._id);
                        dispatch(fetchChats());
                    }
                });
                lastLoadedChatRef.current = currentChat._id;
            }
        }
    }, [chatsStatus, currentChat?._id, chats, isAuth, userData?._id, dispatch]);

    useEffect(() => {
        if (highlightedMessage && messages.length > 0) {
            const element = document.getElementById(`message-${highlightedMessage}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    setHighlightedMessage(null);
                    navigate('/messages', { replace: true });
                }, 3000);
            }
        } else if (!highlightedMessage) {
            scrollToBottom();
        }
    }, [highlightedMessage, messages, navigate]);

    useEffect(() => {
        if (currentChat && messages.length > 0 && userData) {
            // Отмечаем видимые сообщения как прочитанные
            markVisibleMessagesAsRead();
        }
    }, [messages, currentChat, userData]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const markVisibleMessagesAsRead = () => {
        const unreadMessages = messages.filter(msg =>
            msg.sender._id !== userData._id && msg.status !== 'read'
        );
        unreadMessages.forEach(msg => {
            webSocketService.markMessageAsRead(msg._id);
        });
        if (currentChat && unreadMessages.length > 0) {
            webSocketService.markChatAsRead(currentChat._id);
        }
    };

    const handleChatSelect = (chat) => {
        if (chat.unreadCount > 0) {
            webSocketService.markChatAsRead(chat._id);
        }
        dispatch(setCurrentChat(chat));
        // Всегда загружаем сообщения заново при открытии чата
        // Это гарантирует, что все сообщения, полученные через WebSocket во время отсутствия, будут отображены
        dispatch(fetchChatMessages(chat._id));
        // Обновляем флаг загруженного чата
        lastLoadedChatRef.current = chat._id;
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && selectedFiles.length === 0) || !currentChat) return;
        let attachments = [];
        if (selectedFiles.length > 0) {
            const uploadResultAction = await dispatch(uploadMessageFiles(selectedFiles));
            if (uploadMessageFiles.fulfilled.match(uploadResultAction)) {
                attachments = uploadResultAction.payload;
            }
        }
        webSocketService.sendMessage({
            type: 'SEND_MESSAGE',
            data: {
                chatId: currentChat._id,
                text: messageText,
                attachments
            }
        });
        setMessageText('');
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (event) => {
        setSelectedFiles(Array.from(event.target.files));
    };

    const handleCreateChat = async (participantId) => {
        try {
            const resultAction = await dispatch(createChat(participantId));
            if (createChat.fulfilled.match(resultAction)) {
                const newChat = resultAction.payload;
                dispatch(setCurrentChat(newChat));
                dispatch(fetchChatMessages(newChat._id));
                setOpenNewChatDialog(false);
                setSearchTerm('');
            }
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const handleOpenFilesDialog = async () => {
        if (currentChat?._id) {
            setOpenFilesDialog(true);
            await dispatch(fetchChatFiles(currentChat._id));
        }
    };

    const handleDownloadFile = (fileUrl) => {
        window.open(`http://localhost:4444${fileUrl}`, '_blank');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Неизвестно';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleMessageContextMenu = (event, message) => {
        event.preventDefault();
        if (message.sender._id === userData._id) {
            setContextMenu({
                mouseX: event.clientX - 2,
                mouseY: event.clientY - 4,
                message: message
            });
        }
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleStartEdit = (message) => {
        setEditingMessageId(message._id);
        setEditingText(message.text || '');
        handleCloseContextMenu();
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    const handleSaveEdit = () => {
        if (editingMessageId && editingText.trim()) {
            webSocketService.editMessage(editingMessageId, editingText.trim());
            setEditingMessageId(null);
            setEditingText('');
        }
    };

    const canEditMessage = (message) => {
        if (!message || message.sender._id !== userData._id) return false;
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return messageAge <= fifteenMinutes;
    };

    const handleDeleteMessage = (message) => {
        if (window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
            webSocketService.deleteMessage(message._id);
            handleCloseContextMenu();
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const getOtherParticipant = (chat) => {
        if (!userData || !chat.participants) return null;
        return chat.participants.find(p => p._id !== userData._id);
    };

    const getLastMessagePreview = (chat) => {
        if (!chat.lastMessage) return 'Нет сообщений';
        const senderPrefix = chat.lastMessage.sender?._id === userData?._id ? 'Вы: ' : '';
        const textPreview = chat.lastMessage.text || '📎 Вложение';
        return senderPrefix + textPreview;
    };

    const renderMessageStatus = (message) => {
        if (!message || message.sender?._id !== userData?._id) return null;
        switch (message.status) {
            case 'sent': return <Done sx={{ fontSize: 16, opacity: 0.5 }} />;
            case 'delivered': return <DoneAll sx={{ fontSize: 16, opacity: 0.5 }} />;
            case 'read': return <DoneAll sx={{ fontSize: 16 }} />;
            default: return <Done sx={{ fontSize: 16, opacity: 0.5 }} />;
        }
    };

    const filteredSubscribers = subscribers?.filter(subscriber =>
        subscriber.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (!isAuth) return null;

    if (!userData?._id) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '80vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Чаты</Typography>
                            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenNewChatDialog(true)}>
                                Новый чат
                            </Button>
                        </Box>
                        <List sx={{ flex: 1, overflow: 'auto' }}>
                            {chats.map((chat) => {
                                const otherUser = getOtherParticipant(chat);
                                if (!otherUser) return null;
                                const isUnread = chat.unreadCount > 0;
                                return (
                                    <ListItem
                                        key={chat._id}
                                        button
                                        selected={currentChat?._id === chat._id}
                                        onClick={() => handleChatSelect(chat)}
                                        sx={{ mb: 1, borderRadius: 2 }}
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTime(chat.lastMessage?.createdAt)}
                                                </Typography>
                                                {isUnread && <Badge badgeContent={chat.unreadCount} color="primary" sx={{ mt: 0.5 }} />}
                                            </Box>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={otherUser.avatarUrl ? `http://localhost:4444${otherUser.avatarUrl}` : '/noavatar.png'} alt={otherUser.fullName || 'User'} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={otherUser.fullName || 'Пользователь'}
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {renderMessageStatus(chat.lastMessage)}
                                                    <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ ml: chat.lastMessage?.sender?._id === userData?._id ? 0.5 : 0, fontWeight: isUnread ? 'bold' : 'normal' }}>
                                                        {getLastMessagePreview(chat)}
                                                    </Typography>
                                                </Box>
                                            }
                                            primaryTypographyProps={{ fontWeight: isUnread ? 'bold' : 'normal', color: isUnread ? 'text.primary' : 'inherit' }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        {currentChat ? (
                            <>
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">{getOtherParticipant(currentChat)?.fullName || 'Пользователь'}</Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<FolderIcon />}
                                        onClick={handleOpenFilesDialog}
                                    >
                                        Файлы
                                    </Button>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                                    {messages.map((message) => {
                                        const isMyMessage = message.sender._id === userData._id;
                                        const isHighlighted = highlightedMessage === message._id;
                                        const isEditing = editingMessageId === message._id;
                                        const showEditMenu = isMyMessage && canEditMessage(message);
                                        return (
                                            <Box 
                                                id={`message-${message._id}`} 
                                                key={message._id} 
                                                sx={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start', mb: 2 }}
                                                onContextMenu={(e) => handleMessageContextMenu(e, message)}
                                            >
                                                <Box
                                                    sx={{
                                                        maxWidth: '70%',
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: isHighlighted ? 'secondary.light' : (isMyMessage ? 'primary.main' : 'grey.100'),
                                                        color: isMyMessage ? 'white' : 'text.primary',
                                                        transition: 'background-color 0.5s ease',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {showEditMenu && !isEditing && (
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                color: isMyMessage ? 'white' : 'text.secondary',
                                                                opacity: 0.7,
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setContextMenu({
                                                                    mouseX: e.clientX,
                                                                    mouseY: e.clientY,
                                                                    message: message
                                                                });
                                                            }}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    {message.attachments && message.attachments.map((file, index) => (
                                                        <Box key={index} sx={{ mb: 1 }}>
                                                            {file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                                <img src={`http://localhost:4444${file}`} alt="Вложение" style={{ maxWidth: '100%', borderRadius: 4 }} />
                                                            ) : (
                                                                <Chip label={file.split('/').pop()} onClick={() => window.open(`http://localhost:4444${file}`)} variant="outlined" />
                                                            )}
                                                        </Box>
                                                    ))}
                                                    {isEditing ? (
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                value={editingText}
                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{
                                                                    mb: 1,
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: 'white',
                                                                        color: 'text.primary'
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                                <Button size="small" onClick={handleCancelEdit}>Отмена</Button>
                                                                <Button size="small" variant="contained" onClick={handleSaveEdit}>Сохранить</Button>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <>
                                                            {message.text && (
                                                                <Typography variant="body1" sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                    {message.text}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1, gap: 0.5 }}>
                                                        {message.edited && (
                                                            <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
                                                                изменено
                                                            </Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                            {formatTime(message.createdAt)}
                                                        </Typography>
                                                        {renderMessageStatus(message)}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </Box>
                                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                    {selectedFiles.length > 0 && (
                                        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedFiles.map((file, i) => (
                                                <Chip key={i} label={file.name} onDelete={() => setSelectedFiles(files => files.filter(f => f.name !== file.name))} />
                                            ))}
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton onClick={() => fileInputRef.current.click()}>
                                            <AttachFileIcon />
                                        </IconButton>
                                        <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={4}
                                            variant="outlined"
                                            placeholder="Введите сообщение..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <IconButton color="primary" onClick={handleSendMessage} disabled={!messageText.trim() && selectedFiles.length === 0}>
                                            <SendIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography color="textSecondary">Выберите чат для начала общения</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            <Dialog open={openNewChatDialog} onClose={() => setOpenNewChatDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Новый чат</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        placeholder="Поиск подписчиков..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                        }}
                    />
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {subsStatus === 'loading' ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
                        ) : filteredSubscribers.length === 0 ? (
                            <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>{searchTerm ? 'Ничего не найдено' : 'Нет подписчиков'}</Typography>
                        ) : (
                            filteredSubscribers.map((subscriber) => (
                                <ListItemButton key={subscriber._id} onClick={() => handleCreateChat(subscriber._id)} sx={{ borderRadius: 1, mb: 0.5 }}>
                                    <ListItemAvatar>
                                        <Avatar src={subscriber.avatarUrl ? `http://localhost:4444${subscriber.avatarUrl}` : '/noavatar.png'} alt={subscriber.fullName || 'User'} />
                                    </ListItemAvatar>
                                    <ListItemText primary={subscriber.fullName || 'Пользователь'} secondary={subscriber.email} />
                                </ListItemButton>
                            ))
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewChatDialog(false)}>Отмена</Button>
                </DialogActions>
            </Dialog>
            <Dialog 
                open={openFilesDialog} 
                onClose={() => setOpenFilesDialog(false)} 
                maxWidth="lg" 
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '90vh' }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Файлы в переписке</Typography>
                        <IconButton onClick={() => setOpenFilesDialog(false)} size="small">
                            <Typography variant="h6">×</Typography>
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    {filesStatus === 'loading' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : chatFiles.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                В этой переписке пока нет файлов
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={1.5}>
                            {chatFiles.map((file, index) => (
                                <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
                                    <Card 
                                        sx={{ 
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                boxShadow: 3
                                            }
                                        }}
                                        onClick={() => handleDownloadFile(file.url)}
                                    >
                                        {file.isImage ? (
                                            <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                                                <Box
                                                    component="img"
                                                    src={`http://localhost:4444${file.url}`}
                                                    alt={file.fileName}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px 4px 0 0'
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    paddingTop: '100%',
                                                    bgcolor: 'grey.100',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative'
                                                }}
                                            >
                                                <AttachFileIcon sx={{ 
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    fontSize: 32, 
                                                    color: 'text.secondary' 
                                                }} />
                                            </Box>
                                        )}
                                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                            <Typography 
                                                variant="caption" 
                                                component="div" 
                                                noWrap 
                                                sx={{ 
                                                    fontWeight: 500,
                                                    fontSize: '0.7rem',
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                title={file.fileName}
                                            >
                                                {file.fileName}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {file.fileType?.toUpperCase()}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadFile(file.url);
                                                    }}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    <DownloadIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFilesDialog(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                {contextMenu && canEditMessage(contextMenu.message) && (
                    <MenuItem onClick={() => handleStartEdit(contextMenu.message)}>
                        <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                        Редактировать
                    </MenuItem>
                )}
                {contextMenu && contextMenu.message.sender._id === userData._id && (
                    <MenuItem onClick={() => handleDeleteMessage(contextMenu.message)} sx={{ color: 'error.main' }}>
                        <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
                        Удалить
                    </MenuItem>
                )}
            </Menu>
        </Container>
    );
};

export default Messages;