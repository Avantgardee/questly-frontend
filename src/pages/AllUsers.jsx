import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGetAllUser, setSearchQuery } from '../redux/slices/subs';
import { Button, Grid, Card, CardContent, CardActions, Avatar, Typography, Box, TextField, Skeleton, CircularProgress } from '@mui/material';
import axios from '../axios';
import styles from "../components/UserInfo/UserInfo.module.scss";

const AllUsersPage = () => {
    const dispatch = useDispatch();
    const subsItems = useSelector((state) => state.subs.filteredItems);
    const subsStatus = useSelector((state) => state.subs.status);
    const authUser = useSelector((state) => state.auth.data);
    const isSubsLoading = subsStatus === 'loading';
    const isLoadingMore = useSelector((state) => state.subs.loadingMore);
    const hasMore = useSelector((state) => state.subs.pagination?.hasMore || false);
    const searchQuery = useSelector((state) => state.subs.searchQuery);
    const observerTarget = useRef(null);
    const currentPageRef = useRef(1);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        currentPageRef.current = 1;
        dispatch(fetchGetAllUser({ page: 1, limit: 10, search: '', append: false }));
    }, [dispatch]);

    const loadMoreUsers = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            const nextPage = currentPageRef.current + 1;
            dispatch(fetchGetAllUser({ 
                page: nextPage, 
                limit: 10, 
                search: searchQuery, 
                append: true 
            }));
            currentPageRef.current = nextPage;
        }
    }, [isLoadingMore, hasMore, searchQuery, dispatch]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMoreUsers();
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
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [loadMoreUsers, hasMore, isLoadingMore]);

    const handleSubscription = async (userId, isSubscribed) => {
        try {
            const url = isSubscribed ? `/profile/${userId}/unsubscribe` : `/profile/${userId}/subscribe`;
            const response = await axios.post(url, {});

            if (response.status === 200) {
                console.log(response.data.message);
                currentPageRef.current = 1;
                dispatch(fetchGetAllUser({ page: 1, limit: 10, search: searchQuery, append: false }));
            } else {
                console.error('Error subscribing/unsubscribing');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSearch = (event) => {
        const searchNow = event.target.value;
        dispatch(setSearchQuery(searchNow));
        currentPageRef.current = 1;
    };

    // Выполняем поиск при изменении searchQuery
    useEffect(() => {
        // Очищаем предыдущий таймер
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Устанавливаем новый таймер для debounce (500ms)
        searchTimeoutRef.current = setTimeout(async () => {
            await dispatch(fetchGetAllUser({ page: 1, limit: 10, search: searchQuery, append: false }));
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, dispatch]);

    if (subsStatus === 'error') {
        return <div>Error loading data</div>;
    }

    return (
        <Box sx={{ flexGrow: 1, padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                Все пользователи
            </Typography>
            <TextField
                label="Поиск пользователей"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={handleSearch}
                sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
                {isSubsLoading ? (
                    [...Array(8)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', flex: 1 }}>
                                    <Skeleton 
                                        variant="circular" 
                                        width={60} 
                                        height={60} 
                                        sx={{ mb: 2 }}
                                        animation="wave"
                                    />
                                    <Skeleton 
                                        variant="text" 
                                        width="80%" 
                                        height={32} 
                                        sx={{ mb: 1 }}
                                        animation="wave"
                                    />
                                    <Skeleton 
                                        variant="text" 
                                        width="60%" 
                                        height={24}
                                        animation="wave"
                                    />
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                    <Skeleton 
                                        variant="rectangular" 
                                        width={120} 
                                        height={36} 
                                        sx={{ borderRadius: 1 }}
                                        animation="wave"
                                    />
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    subsItems.map((user) => {
                        const isSubscribed = authUser && user.subscribers.includes(authUser._id);
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 3
                                        }
                                    }}
                                >
                                    <Link to={`/profile/${user._id}`} className={styles.linkToUser} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', flex: 1 }}>
                                            <Avatar 
                                                alt={user.fullName} 
                                                src={user.avatarUrl ? `http://localhost:4444${user.avatarUrl}` : '/noavatar.png'} 
                                                sx={{ 
                                                    width: 80, 
                                                    height: 80, 
                                                    mb: 2,
                                                    border: '3px solid',
                                                    borderColor: 'primary.main',
                                                    boxShadow: 2
                                                }} 
                                            />
                                            <Typography 
                                                variant="h6" 
                                                align="center"
                                                sx={{ 
                                                    fontWeight: 600,
                                                    mb: 0.5,
                                                    color: 'text.primary'
                                                }}
                                            >
                                                {user.fullName}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary" 
                                                align="center"
                                                sx={{ 
                                                    fontSize: '0.875rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                {user.email}
                                            </Typography>
                                        </CardContent>
                                    </Link>
                                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                        {authUser && authUser._id !== user._id && (
                                            <Button
                                                variant="contained"
                                                color={isSubscribed ? 'secondary' : 'primary'}
                                                onClick={() => handleSubscription(user._id, isSubscribed)}
                                                sx={{
                                                    minWidth: 120,
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {isSubscribed ? 'Отписаться' : 'Подписаться'}
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })
                )}
                {isLoadingMore && (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Grid>
                )}
                <div ref={observerTarget} style={{ height: '20px', width: '100%' }} />
            </Grid>
        </Box>
    );
};

export default AllUsersPage;
