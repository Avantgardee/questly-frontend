import React, { useState, useRef } from 'react';
import { Button, Popper, Paper, List, ListItem, ListItemText, Link, Typography, Avatar, ListItemAvatar, Box, ClickAwayListener } from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification }) => {
    const { actionByUser, post, action, createdAt } = notification;
    let notificationText = '';

    // Проверяем, что actionByUser существует
    if (!actionByUser) {
        return (
            <ListItem alignItems="flex-start">
                <ListItemText
                    primary="Неизвестное уведомление"
                    secondary={
                        <Typography variant="body2" color="textSecondary">
                            {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : 'Неизвестное время'}
                        </Typography>
                    }
                />
            </ListItem>
        );
    }

    // Генерация текста уведомления в зависимости от действия
    switch (action) {
        case 'subscribe':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName || 'Неизвестный пользователь'}</Link> подписался на вас.
                </>
            );
            break;
        case 'post':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName || 'Неизвестный пользователь'}</Link> добавил новую статью{' '}
                    {post && post._id ? (
                        <Link href={`/posts/${post._id}`}>{post.title || 'Без названия'}</Link>
                    ) : (
                        'статью'
                    )}.
                </>
            );
            break;
        case 'comment':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName || 'Неизвестный пользователь'}</Link> добавил комментарий на вашу статью{' '}
                    {post && post._id ? (
                        <Link href={`/posts/${post._id}`}>{post.title || 'Без названия'}</Link>
                    ) : (
                        'статью'
                    )}.
                </>
            );
            break;
        case 'like':
            notificationText = (
                <>
                    Пользователю <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName || 'Неизвестный пользователь'}</Link> понравилась ваша статья{' '}
                    {post && post._id ? (
                        <Link href={`/posts/${post._id}`}>{post.title || 'Без названия'}</Link>
                    ) : (
                        'статью'
                    )}.
                </>
            );
            break;
        default:
            notificationText = 'Новое уведомление';
    }

    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Avatar
                    alt={actionByUser.fullName || 'Пользователь'}
                    src={actionByUser.avatarUrl ? `http://localhost:4444${actionByUser.avatarUrl}` : '/noavatar.png'}
                />
            </ListItemAvatar>
            <ListItemText
                primary={notificationText}
                secondary={
                    <Typography variant="body2" color="textSecondary">
                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </Typography>
                }
                sx={{ wordBreak: 'break-word' }}
            />
            {post?.imageUrl && post.imageUrl !== "" && (
                <Box sx={{ marginLeft: 2, marginTop: 2 }}>
                    <Avatar
                        variant="square"
                        src={`http://localhost:4444${post.imageUrl}`}
                        alt={post.title || 'Изображение статьи'}
                        sx={{ width: 50, height: 50 }}
                    />
                </Box>
            )}
        </ListItem>
    );
};

const NotificationPopper = ({ notifications }) => {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const buttonRef = useRef(null);

    const handleClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        // Не закрываем, если клик был на кнопке
        if (buttonRef.current && buttonRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    // Фильтруем уведомления, удаляя те, у которых нет actionByUser
    const validNotifications = notifications.filter(notif => notif.actionByUser !== null);

    return (
        <>
            <Button 
                ref={buttonRef}
                onClick={handleClick} 
                variant="contained" 
                color="info" 
                startIcon={<NotificationsIcon />}
            >
                 {validNotifications.length > 0 ? `(${validNotifications.length})` : ''}
            </Button>
            {open && (
                <ClickAwayListener onClickAway={handleClose}>
                    <Popper open={open} anchorEl={anchorEl} placement="bottom-start">
                        <Paper
                            sx={{
                                width: '400px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                p: 2
                            }}
                        >
                            <List>
                                {validNotifications.length > 0 ? (
                                    validNotifications.map((notif) => (
                                        <NotificationItem key={notif._id || notif.id || Math.random()} notification={notif} />
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="Нет новых уведомлений" />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Popper>
                </ClickAwayListener>
            )}
        </>
    );
};

export default NotificationPopper;