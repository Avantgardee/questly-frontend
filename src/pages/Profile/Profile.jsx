// pages/UserProfile.js (обновленная часть с кнопкой добавления заметки)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, Avatar, Button, Typography, Grid, Box, FormControlLabel, Switch, IconButton, CircularProgress } from '@mui/material';
import styles from './Profile.module.scss';
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import axios from "../../axios";
import {
    fetchPostsWithUser,
    filterByComments, filterByCreatedAt,
    filterByTitle,
    filterByViews,
    filterByLikes
} from "../../redux/slices/posts";
import { fetchGetUser } from "../../redux/slices/user";
import { Post } from "../../components";
import { formatInTimeZone } from 'date-fns-tz';
import SearchBar from "../../components/SearchBar";
import EditProfileDialog from "../../components/EditProfileDialog";

import { Add as AddIcon } from '@mui/icons-material';
import AddNoteDialog from "../../components/NoteModal/AddNoteModal";

const convertToTimezone = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd HH:mm:ss');
};

const convertToDateBirth = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'dd-MM-yyyy');
};

export const UserProfile = () => {
    const dispatch = useDispatch();
    const selectUserData = useSelector((state) => state.auth.data);
    const userData = useSelector((state) => state.user.data);
    const userStatus = useSelector((state) => state.user.status);
    const { posts } = useSelector(state => state.posts);
    const timeZone = 'Europe/Moscow';
    const { id } = useParams();
    const isPostsLoading = posts.status === 'loading';
    const isUserLoading = userStatus === 'loading';
    const isLoadingMore = posts.loadingMore;
    const hasMore = posts.pagination?.hasMore || false;
    const observerTarget = useRef(null);
    const currentPageRef = useRef(1);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    React.useEffect(() => {
        currentPageRef.current = 1;
        dispatch(fetchGetUser(id));
        dispatch(fetchPostsWithUser({ user: id, page: 1, limit: 10, append: false }));
    }, [id, dispatch, editDialogOpen]);

    const loadMorePosts = useCallback(() => {
        if (!isLoadingMore && hasMore && id) {
            const nextPage = currentPageRef.current + 1;
            dispatch(fetchPostsWithUser({ user: id, page: nextPage, limit: 10, append: true }));
            currentPageRef.current = nextPage;
        }
    }, [isLoadingMore, hasMore, id, dispatch]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
            // Cleanup для таймера поиска
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [loadMorePosts, hasMore, isLoadingMore]);

    const [checked, setChecked] = useState(false);
    const [activeTab, setActiveTab] = useState('createdAt');
    const [searchQuery, setSearchQuery] = useState('');
    const searchTimeoutRef = useRef(null);

    const handleSearchChange = (event) => {
        const searchNow = event.target.value;
        setSearchQuery(searchNow);
        currentPageRef.current = 1;
        
        // Очищаем предыдущий таймер
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Устанавливаем новый таймер для debounce (500ms)
        searchTimeoutRef.current = setTimeout(async () => {
            // Перезагружаем посты с новым поисковым запросом
            await dispatch(fetchPostsWithUser({ user: id, page: 1, limit: 10, append: false }));
            // Применяем фильтр по заголовку на клиенте
            dispatch(filterByTitle(searchNow));
        }, 500);
    };

    const handleChange = async (event) => {
        const newChecked = event.target.checked;
        setChecked(newChecked);
        currentPageRef.current = 1;
        // Перезагружаем посты
        await dispatch(fetchPostsWithUser({ user: id, page: 1, limit: 10, append: false }));
        // Применяем сортировку
        handleTabChange(activeTab, newChecked);
    };

    const handleTabChange = async (filterValue, direction) => {
        setActiveTab(filterValue);
        currentPageRef.current = 1;
        const likesFilter = filterValue === 'likes' ? (direction ? 'most' : 'least') : undefined;
        // Перезагружаем посты с серверной фильтрацией для лайков
        if (filterValue === 'likes') {
            await dispatch(fetchPostsWithUser({ user: id, page: 1, limit: 10, append: false, likesFilter }));
        } else {
            await dispatch(fetchPostsWithUser({ user: id, page: 1, limit: 10, append: false }));
            // Применяем сортировку на клиенте
            const sortDirection = direction ? 'desc' : 'asc';
            switch (filterValue) {
                case 'comments':
                    dispatch(filterByComments(sortDirection));
                    break;
                case 'viewsCount':
                    dispatch(filterByViews(sortDirection));
                    break;
                case 'createdAt':
                    dispatch(filterByCreatedAt(sortDirection));
                    break;
                default:
                    break;
            }
        }
    };

    if (isUserLoading || !userData) {
        return <></>;
    }
    const subscribed = selectUserData && userData.subscribers.includes(selectUserData._id);

    const handleSubscription = async () => {
        try {
            const url = subscribed ? `/profile/${id}/unsubscribe` : `/profile/${id}/subscribe`;
            const response = await axios.post(url, {});

            if (response.status === 200) {
                console.log(response.data.message);
                dispatch(fetchGetUser(id));
            } else {
                console.error('Error subscribing/unsubscribing');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <>
            <Card sx={{ maxWidth: 400, margin: 'auto', marginBottom: "40px", mt: 5, p: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, position: 'relative' }}>
                    <Avatar
                        alt={userData.fullName}
                        src={userData.avatarUrl ? `http://localhost:4444${userData.avatarUrl}` : '/noavatar.png'}
                        sx={{ width: 150, height: 150 }}
                    />
                    {selectUserData && selectUserData._id === userData._id && (
                        <IconButton
                            sx={{
                                position: 'absolute',
                                right: 'calc(50% - 100px)',
                                bottom: 0,
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                }
                            }}
                            onClick={() => setNoteDialogOpen(true)}
                        >
                            <AddIcon />
                        </IconButton>
                    )}
                </Box>
                {selectUserData && selectUserData._id !== userData._id && (
                    <Grid container spacing={2} justifyContent="center" sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                        <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button variant="contained" color="primary" onClick={handleSubscription}>
                                {subscribed ? 'Отписаться' : 'Подписаться'}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }} className={styles.infoCard}>
                        <Box sx={{ flex: '1 1 0', textAlign: 'center' }} >
                            <Link to={`/profile/${id}/subscribers`} className={styles.infoCard}>
                                <Typography variant="subtitle1" className={styles.stat}>
                                    Подписчики:
                                </Typography>
                                <Typography variant="h6">
                                    {userData.subscribers.length}
                                </Typography>
                            </Link>
                        </Box>
                        <Box sx={{ flex: '1 1 0', textAlign: 'center' }} className={styles.infoCard}>
                            <Link to={`/profile/${id}/subscriptions`} className={styles.infoCard}>
                                <Typography variant="subtitle1" className={styles.stat}>
                                    Подписки:
                                </Typography>
                                <Typography variant="h6">
                                    {userData.subscriptions.length}
                                </Typography>
                            </Link>
                        </Box>
                        <Box sx={{ flex: '1 1 0', textAlign: 'center' }} >
                            <Typography variant="subtitle1" className={styles.stat}>
                                Статьи:
                            </Typography>
                            <Typography variant="h6">
                                {posts.items.length}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="h4" component="div" align="center" className={styles.name}>
                        {userData.fullName}
                    </Typography>
                    <hr />
                    <div className={styles.infoBlock}>
                        <Typography variant="subtitle2" component="div" align="center" color="text.secondary">
                            Дата рождения:
                        </Typography>
                        <Typography variant="body1" align="center" className={`${styles.birth} ${styles.info}`} sx={{ mt: 1 }}>
                            {convertToDateBirth(userData.birthDate, timeZone)}
                        </Typography>
                    </div>
                    <div className={styles.infoBlock}>
                        <Typography variant="subtitle2" component="div" align="center" color="text.secondary">
                            Почта:
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" className={`${styles.mail} ${styles.info}`} align="center">
                            {userData.email}
                        </Typography>
                    </div>
                    <div className={styles.infoBlock}>
                        <Typography variant="subtitle2" component="div" align="center" color="text.secondary">
                            О себе:
                        </Typography>
                        <Typography variant="body1" align="center" className={styles.textBlock} sx={{ mt: 1 }}>
                            {userData.bio}
                        </Typography>
                    </div>
                </CardContent>
                {selectUserData && selectUserData._id === userData._id && (
                    <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button variant="outlined" color="primary" onClick={() => setEditDialogOpen(true)}>Изменить профиль</Button>
                    </Grid>
                )}
            </Card>
            <Button
                variant={activeTab === 'createdAt' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('createdAt', checked)}
            >
                Новые
            </Button>
            <Button
                variant={activeTab === 'viewsCount' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('viewsCount', checked)}
            >
                По времени добавления
            </Button>
            <Button
                variant={activeTab === 'comments' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('comments', checked)}
            >
                По комментариям
            </Button>
            <Button
                variant={activeTab === 'likes' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('likes', checked)}
            >
                По лайкам
            </Button>
            <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label={checked ? "От большего к меньшему" : "От меньшего к большему"}
                labelPlacement="start"
            />
            <SearchBar value={searchQuery} onChange={handleSearchChange} />
            <Grid container spacing={12}>
                <Grid xs={12} item>
                    {posts.items.length === 0 ? (
                        <Typography
                            variant="h4"
                            sx={{
                                marginBottom: '15px',
                                fontWeight: "bold",
                            }}
                        >
                            Не удалось найти статьи
                        </Typography>
                    ) : (
                        (isPostsLoading ? [...Array(5)] : posts.items).map((obj, index) =>
                            isPostsLoading ? (
                                <Post key={index} isLoading={true} />
                            ) : (
                                <Post
                                    key={obj._id}
                                    id={obj._id}
                                    title={obj.title}
                                    imageUrl={obj.imageUrl ? `http://localhost:4444${obj.imageUrl}` : ''}
                                    user={obj.user}
                                    createdAt={convertToTimezone(obj.createdAt, timeZone)}
                                    viewsCount={obj.viewsCount}
                                    commentsCount={obj.comments?.length || 0}
                                    tags={obj.tags}
                                    likes={obj.likes || []}
                                    isLiked={obj.isLiked}
                                    isEditable={selectUserData?._id === obj.user._id}
                                />
                            )
                        )
                    )}
                    {isLoadingMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <div ref={observerTarget} style={{ height: '20px' }} />
                </Grid>
            </Grid>
            <EditProfileDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                userData={userData}
            />
            <AddNoteDialog
                open={noteDialogOpen}
                onClose={() => setNoteDialogOpen(false)}
                userId={userData._id}
            />
        </>
    );
};