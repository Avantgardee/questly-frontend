import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Grid, Paper, TextField, Button, List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Typography, IconButton, Box, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, ListItemButton, InputAdornment, CircularProgress, Badge,
    ImageList, ImageListItem, Card, CardMedia, CardContent, CardActionArea
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon, Search as SearchIcon, Add as AddIcon, Done, DoneAll, Folder as FolderIcon, Download as DownloadIcon } from '@mui/icons-material';
import {
    fetchChatMessages, fetchChats, createChat, uploadMessageFiles, addMessage,
    updateMessageStatus, setCurrentChat, fetchChatFiles
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

        const handleWebSocketMessage = (message) => {
            const activeChat = currentChatRef.current;
            const currentUser = userDataRef.current;

            switch (message.type) {
                case 'NEW_MESSAGE': {
                    dispatch(addMessage({ ...message.data, currentUserId: currentUser?._id }));

                    const newMessage = message.data.message;
                    const isMyMessage = newMessage.sender._id === currentUser?._id;
                    const isCurrentChat = newMessage.chat === activeChat?._id;

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
                    break;
                default:
                    break;
            }
        };

        const fetchWsTokenAndConnect = async () => {
            try {
                const response = await axios.get('/auth/ws-token');
                if (response.data.wsToken) {
                    webSocketService.connect(response.data.wsToken);
                    webSocketService.addMessageHandler(handleWebSocketMessage);
                }
            } catch (error) {
                console.error('Error fetching WebSocket token:', error);
            }
        };

        fetchWsTokenAndConnect();

        return () => {
            webSocketService.removeMessageHandler(handleWebSocketMessage);
            webSocketService.disconnect();
        };
    }, [dispatch, isAuth, navigate, userData?._id]);

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
        dispatch(fetchChatMessages(chat._id));
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
                                        return (
                                            <Box id={`message-${message._id}`} key={message._id} sx={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        maxWidth: '70%',
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: isHighlighted ? 'secondary.light' : (isMyMessage ? 'primary.main' : 'grey.100'),
                                                        color: isMyMessage ? 'white' : 'text.primary',
                                                        transition: 'background-color 0.5s ease'
                                                    }}
                                                >
                                                    {message.attachments && message.attachments.map((file, index) => (
                                                        <Box key={index} sx={{ mb: 1 }}>
                                                            {file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                                <img src={`http://localhost:4444${file}`} alt="Вложение" style={{ maxWidth: '100%', borderRadius: 4 }} />
                                                            ) : (
                                                                <Chip label={file.split('/').pop()} onClick={() => window.open(`http://localhost:4444${file}`)} variant="outlined" />
                                                            )}
                                                        </Box>
                                                    ))}
                                                    {message.text && (
                                                        <Typography variant="body1" sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
                                                    )}
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1, ml: 2 }}>
                                                        <Typography variant="caption" sx={{ opacity: 0.7, mr: 0.5 }}>
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
        </Container>
    );
};

export default Messages;