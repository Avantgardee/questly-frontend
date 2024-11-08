import React, { useState } from 'react';
import { Button, Popper, Paper, List, ListItem, ListItemText, Link, Typography, Avatar, ListItemAvatar, Box } from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { formatDistanceToNow } from 'date-fns'; // Для красивого отображения времени

const NotificationItem = ({ notification }) => {
    const { actionByUser, post, action, createdAt } = notification;
    let notificationText = '';

    // Генерация текста уведомления в зависимости от действия
    switch (action) {
        case 'subscribe':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName}</Link> подписался на вас.
                </>
            );
            break;
        case 'post':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName}</Link> добавил новую статью <Link href={`/posts/${post._id}`}>{post.title}</Link>.
                </>
            );
            break;
        case 'comment':
            notificationText = (
                <>
                    Пользователь <Link href={`/profile/${actionByUser._id}`}>{actionByUser.fullName}</Link> добавил комментарий на вашу статью <Link href={`/posts/${post._id}`}>{post.title}</Link>.
                </>
            );
            break;
        default:
            notificationText = 'Новое уведомление';
    }

    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                {/* Аватар пользователя, который выполнил действие */}
                <Avatar alt={actionByUser.fullName} src={`http://localhost:4444${actionByUser.avatarUrl}`} />
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
                <Box sx={{ marginLeft: 2,marginTop: 2 }}>
                    <Avatar
                        variant="square"
                        src={`http://localhost:4444${post.imageUrl}`}
                        alt={post.title}
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

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen((prevOpen) => !prevOpen);
    };

    return (
        <>
            <Button onClick={handleClick} variant="contained" color="info" startIcon={<NotificationsIcon />}>
                Уведомления
            </Button>
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
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <NotificationItem key={notif.id} notification={notif} />
                            ))
                        ) : (
                            <ListItem>
                                <ListItemText primary="Нет новых уведомлений" />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            </Popper>
        </>
    );
};

// Экспорт компонента для использования в других частях приложения
export default NotificationPopper;
