import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Post } from '../components/Post';
import { fetchPostsWithTag, filterByComments, filterByViews, filterByCreatedAt, filterByTitle, filterByLikes } from "../redux/slices/posts";
import { formatInTimeZone } from 'date-fns-tz';
import { useParams } from "react-router-dom";
import { FormControlLabel, Switch, Button, Typography, Grid, Box, CircularProgress } from "@mui/material";
import SearchBar from "../components/SearchBar";

const convertToTimezone = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd HH:mm:ss');
};

export const TagsPage = () => {
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.auth.data);
    const { posts } = useSelector(state => state.posts);
    const timeZone = 'Europe/Moscow';
    const { id } = useParams();
    const isPostsLoading = posts.status === 'loading';
    const isLoadingMore = posts.loadingMore;
    const hasMore = posts.pagination?.hasMore || false;
    const observerTarget = useRef(null);
    const currentPageRef = useRef(1);

    React.useEffect(() => {
        currentPageRef.current = 1;
        dispatch(fetchPostsWithTag({ tag: id, page: 1, limit: 10, append: false }));
    }, [dispatch, id]);

    const loadMorePosts = useCallback(() => {
        if (!isLoadingMore && hasMore && id) {
            const nextPage = currentPageRef.current + 1;
            dispatch(fetchPostsWithTag({ tag: id, page: nextPage, limit: 10, append: true }));
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

    const [checked, setChecked] = useState(true);
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
            await dispatch(fetchPostsWithTag({ tag: id, page: 1, limit: 10, append: false }));
            // Применяем фильтр по заголовку на клиенте
            dispatch(filterByTitle(searchNow));
        }, 500);
    };

    const handleChange = async (event) => {
        const newChecked = event.target.checked;
        setChecked(newChecked);
        currentPageRef.current = 1;
        // Перезагружаем посты
        await dispatch(fetchPostsWithTag({ tag: id, page: 1, limit: 10, append: false }));
        // Применяем сортировку
        handleTabChange(activeTab, newChecked);
    };

    const handleTabChange = async (filterValue, direction) => {
        setActiveTab(filterValue);
        currentPageRef.current = 1;
        const likesFilter = filterValue === 'likes' ? (direction ? 'most' : 'least') : undefined;
        // Перезагружаем посты с серверной фильтрацией для лайков
        if (filterValue === 'likes') {
            await dispatch(fetchPostsWithTag({ tag: id, page: 1, limit: 10, append: false, likesFilter }));
        } else {
            await dispatch(fetchPostsWithTag({ tag: id, page: 1, limit: 10, append: false }));
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

    return (
        <>
            <Typography variant="h4"
                        sx={{
                            marginBottom: '15px',
                            fontWeight: "bold",
                        }}
            >Статьи с тэгом: {id}</Typography>
            <Button
                variant={activeTab === 'createdAt' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('createdAt', checked)}
            >
                По времени добавления
            </Button>
            <Button
                variant={activeTab === 'viewsCount' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('viewsCount', checked)}
            >
                По просмотрам
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
            <Grid container spacing={4} sx={{ marginTop: '10px' }}>
                <Grid item xs={13}>
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
                                    key={obj._id} // Добавлено поле key для идентификации элемента в списке
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
                                    isEditable={userData?._id === obj.user._id}
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
        </>
    );
};
