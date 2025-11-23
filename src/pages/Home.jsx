import React, { useState, useEffect, useRef, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import { useDispatch, useSelector } from "react-redux";
import { Post } from '../components/Post';
import { TagsBlock } from '../components/TagsBlock';
import { fetchPosts, fetchPostsWithFilter, fetchPostsWithFilterAndSubs, fetchTags } from "../redux/slices/posts";
import { formatInTimeZone } from 'date-fns-tz';
import { 
  FormControlLabel, 
  Switch, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  ToggleButtonGroup, 
  ToggleButton,
  Stack,
  Container,
  Divider,
  CircularProgress
} from "@mui/material";
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import SearchBar from "../components/SearchBar";
import { fetchAuthMe } from "../redux/slices/auth";

const convertToTimezone = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd HH:mm:ss');
};

export const Home = () => {
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.auth.data);
    const { posts, tags } = useSelector(state => state.posts);
    const timeZone = 'Europe/Moscow';
    const isTagsLoading = tags.status === 'loading';
    const isPostsLoading = posts.status === 'loading';
    const isLoadingMore = posts.loadingMore;
    const hasMore = posts.pagination?.hasMore || false;
    const observerTarget = useRef(null);
    const currentPageRef = useRef(1);

    useEffect(() => {
        currentPageRef.current = 1;
        dispatch(fetchPostsWithFilter({ 
            filter: 'createdAt', 
            direction: 'desc', 
            search: '', 
            page: 1, 
            limit: 10, 
            append: false 
        }));
        dispatch(fetchTags());
        dispatch(fetchAuthMe());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // Cleanup для таймера поиска
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const [checked, setChecked] = useState(true);
    const [activeTab, setActiveTab] = useState('createdAt');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBySubs, setFilterBySubs] = useState(false);
    const searchTimeoutRef = useRef(null);

    const fetchPostsData = async (filterValue, direction, search, subs, page = 1, append = false) => {
        currentPageRef.current = page;
        if (subs) {
            await dispatch(fetchPostsWithFilterAndSubs({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search,
                page,
                limit: 10,
                append
            }));
        } else {
            await dispatch(fetchPostsWithFilter({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search,
                page,
                limit: 10,
                append
            }));
        }
    };

    const loadMorePosts = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            const nextPage = currentPageRef.current + 1;
            fetchPostsData(activeTab, checked, searchQuery, filterBySubs, nextPage, true);
        }
    }, [isLoadingMore, hasMore, activeTab, checked, searchQuery, filterBySubs]);

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
        };
    }, [loadMorePosts, hasMore, isLoadingMore]);

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
            // Используем актуальные значения напрямую
            if (filterBySubs) {
                await dispatch(fetchPostsWithFilterAndSubs({
                    filter: activeTab,
                    direction: checked ? 'desc' : 'asc',
                    search: searchNow,
                    page: 1,
                    limit: 10,
                    append: false
                }));
            } else {
                await dispatch(fetchPostsWithFilter({
                    filter: activeTab,
                    direction: checked ? 'desc' : 'asc',
                    search: searchNow,
                    page: 1,
                    limit: 10,
                    append: false
                }));
            }
        }, 500);
    };

    const handleChange = async (event) => {
        const newChecked = event.target.checked;
        setChecked(newChecked);
        currentPageRef.current = 1;
        // Используем актуальные значения напрямую
        if (filterBySubs) {
            await dispatch(fetchPostsWithFilterAndSubs({
                filter: activeTab,
                direction: newChecked ? 'desc' : 'asc',
                search: searchQuery,
                page: 1,
                limit: 10,
                append: false
            }));
        } else {
            await dispatch(fetchPostsWithFilter({
                filter: activeTab,
                direction: newChecked ? 'desc' : 'asc',
                search: searchQuery,
                page: 1,
                limit: 10,
                append: false
            }));
        }
    };

    const handleTabChange = async (filterValue, direction, search, subs) => {
        setActiveTab(filterValue);
        currentPageRef.current = 1;
        // Используем актуальные значения напрямую
        if (subs) {
            await dispatch(fetchPostsWithFilterAndSubs({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search || '',
                page: 1,
                limit: 10,
                append: false
            }));
        } else {
            await dispatch(fetchPostsWithFilter({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search || '',
                page: 1,
                limit: 10,
                append: false
            }));
        }
    };

    const handleFilterBySubsChange = async (event) => {
        const newValue = event.target.checked;
        setFilterBySubs(newValue);
        currentPageRef.current = 1;
        // Используем актуальные значения напрямую
        if (newValue) {
            await dispatch(fetchPostsWithFilterAndSubs({
                filter: activeTab,
                direction: checked ? 'desc' : 'asc',
                search: searchQuery,
                page: 1,
                limit: 10,
                append: false
            }));
        } else {
            await dispatch(fetchPostsWithFilter({
                filter: activeTab,
                direction: checked ? 'desc' : 'asc',
                search: searchQuery,
                page: 1,
                limit: 10,
                append: false
            }));
        }
    };

    return (
        <Container maxWidth="lg">
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 2,
                    background: 'linear-gradient(to right, #f5f7fa, #e9edf2)'
                }}
            >
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Лента публикаций
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                    <SearchBar 
                        value={searchQuery} 
                        onChange={handleSearchChange} 
                        fullWidth 
                        placeholder="Поиск по статьям..."
                    />
                </Box>

                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                >
                    <ToggleButtonGroup
                        value={activeTab}
                        exclusive
                        onChange={(e, newTab) => newTab && handleTabChange(newTab, checked, searchQuery, filterBySubs)}
                        aria-label="Сортировка"
                        size="small"
                        color="primary"
                        sx={{ mb: { xs: 2, sm: 0 } }}
                    >
                        <ToggleButton value="createdAt" aria-label="По дате">
                            <AccessTimeIcon sx={{ mr: 1 }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>По дате</Box>
                        </ToggleButton>
                        <ToggleButton value="viewsCount" aria-label="По просмотрам">
                            <VisibilityIcon sx={{ mr: 1 }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Просмотры</Box>
                        </ToggleButton>
                        <ToggleButton value="comments" aria-label="По комментариям">
                            <CommentIcon sx={{ mr: 1 }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Комментарии</Box>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={checked} 
                                    onChange={handleChange} 
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SortIcon sx={{ mr: 0.5 }} />
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                        {checked ? "По убыванию" : "По возрастанию"}
                                    </Box>
                                </Box>
                            }
                            labelPlacement="start"
                            sx={{ m: 0 }}
                        />

                        <Divider orientation="vertical" flexItem />

                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={filterBySubs} 
                                    onChange={handleFilterBySubsChange} 
                                    color="secondary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <GroupIcon sx={{ mr: 0.5 }} />
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                        {filterBySubs ? "Мои подписки" : "Все посты"}
                                    </Box>
                                </Box>
                            }
                            labelPlacement="start"
                            sx={{ m: 0 }}
                        />
                    </Stack>
                </Stack>
            </Paper>
            <Grid container spacing={4} sx={{ marginTop: '10px' }}>
                <Grid xs={8} item>
                    {(posts.items.length === 0 && !isPostsLoading ) ?  (
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
                                <Box key={index} mb={3}>
                                    <Post isLoading={true} />
                                </Box>
                            ) : (
                                <Box 
                                    key={obj._id} 
                                    mb={3}
                                    sx={{
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 3
                                        }
                                    }}
                                >
                                    <Post
                                        _id={obj._id}
                                        title={obj.title}
                                        imageUrl={obj.imageUrl ? `http://localhost:4444${obj.imageUrl}` : ''}
                                        user={obj.user}
                                        createdAt={convertToTimezone(obj.createdAt, timeZone)}
                                        viewsCount={obj.viewsCount}
                                        commentsCount={obj.comments ? obj.comments.length : 0}
                                        tags={obj.tags}
                                        isEditable={userData?._id === obj.user._id}
                                    />
                                </Box>
                            )
                        )
                    )}
                    {!isPostsLoading && posts.items.length === 0 && (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" color="textSecondary">
                                {filterBySubs 
                                    ? 'Вы пока не подписаны ни на одного автора' 
                                    : 'Публикации не найдены'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {filterBySubs 
                                    ? 'Подпишитесь на интересных авторов, чтобы видеть их посты здесь' 
                                    : 'Попробуйте изменить параметры поиска или фильтры'}
                            </Typography>
                        </Paper>
                    )}
                    {isLoadingMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <div ref={observerTarget} style={{ height: '20px' }} />
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Box position="sticky" top={80}>
                        <TagsBlock 
                            items={tags.items} 
                            isLoading={isTagsLoading} 
                            title="Популярные теги"
                            sx={{ mb: 3 }}
                        />
                        
                        <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Сортировка и фильтры
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Сортировать по:
                                    </Typography>
                                    <ToggleButtonGroup
                                        value={activeTab}
                                        exclusive
                                        onChange={(e, newTab) => newTab && handleTabChange(newTab, checked, searchQuery, filterBySubs)}
                                        fullWidth
                                        orientation="vertical"
                                        size="small"
                                    >
                                        <ToggleButton value="createdAt">
                                            <AccessTimeIcon sx={{ mr: 1 }} />
                                            Дате публикации
                                        </ToggleButton>
                                        <ToggleButton value="viewsCount">
                                            <VisibilityIcon sx={{ mr: 1 }} />
                                            Количеству просмотров
                                        </ToggleButton>
                                        <ToggleButton value="comments">
                                            <CommentIcon sx={{ mr: 1 }} />
                                            Количеству комментариев
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={checked} 
                                            onChange={handleChange} 
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <SortIcon sx={{ mr: 1 }} />
                                            {checked ? "По убыванию" : "По возрастанию"}
                                        </Box>
                                    }
                                    labelPlacement="start"
                                    sx={{ 
                                        m: 0, 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        width: '100%'
                                    }}
                                />
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={filterBySubs} 
                                            onChange={handleFilterBySubsChange} 
                                            color="secondary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <GroupIcon sx={{ mr: 1 }} />
                                            {filterBySubs ? "Только мои подписки" : "Все посты"}
                                        </Box>
                                    }
                                    labelPlacement="start"
                                    sx={{ 
                                        m: 0, 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        width: '100%'
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};
