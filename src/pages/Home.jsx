import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { useDispatch, useSelector } from "react-redux";
import { Post } from '../components/Post';
import { TagsBlock } from '../components/TagsBlock';
import { fetchPosts, fetchPostsWithFilter, fetchPostsWithFilterAndSubs, fetchTags } from "../redux/slices/posts";
import { formatInTimeZone } from 'date-fns-tz';
import { FormControlLabel, Switch, Button, Typography } from "@mui/material";
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

    useEffect(() => {
        dispatch(fetchPosts());
        dispatch(fetchTags());
        dispatch(fetchAuthMe());
    }, [dispatch]);

    const [checked, setChecked] = useState(true);
    const [activeTab, setActiveTab] = useState('createdAt');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBySubs, setFilterBySubs] = useState(false);

    const fetchPostsData = async (filterValue, direction, search, subs) => {
        if (subs) {
            await dispatch(fetchPostsWithFilterAndSubs({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search,
            }));
        } else {
            await dispatch(fetchPostsWithFilter({
                filter: filterValue,
                direction: direction ? 'desc' : 'asc',
                search: search,
            }));
        }
    };

    const handleSearchChange = async (event) => {
        const searchNow = event.target.value;
        setSearchQuery(searchNow);
        await fetchPostsData(activeTab, checked, searchNow, filterBySubs);
    };

    const handleChange = async (event) => {
        const newChecked = event.target.checked;
        await setChecked(newChecked);
        await fetchPostsData(activeTab, newChecked, searchQuery, filterBySubs);
    };

    const handleTabChange = async (filterValue, direction, search, subs) => {
        setActiveTab(filterValue);
        await fetchPostsData(filterValue, direction, search, subs);
    };

    const handleFilterBySubsChange = async (event) => {
        const newValue = event.target.checked;
        setFilterBySubs(newValue);
        await fetchPostsData(activeTab, checked, searchQuery, newValue);
    };

    return (
        <>
            <Button
                variant={activeTab === 'createdAt' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('createdAt', checked, searchQuery, filterBySubs)}
            >
                По времени добавления
            </Button>
            <Button
                variant={activeTab === 'viewsCount' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('viewsCount', checked, searchQuery, filterBySubs)}
            >
                По просмотрам
            </Button>
            <Button
                variant={activeTab === 'comments' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('comments', checked, searchQuery, filterBySubs)}
            >
                По комментариям
            </Button>
            <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label={checked ? "От большего к меньшему" : "От меньшего к большему"}
                labelPlacement="start"
            />
            <FormControlLabel
                control={<Switch checked={filterBySubs} onChange={handleFilterBySubsChange} />}
                label={filterBySubs ? "Показывать только подписки" : "Показывать все посты"}
                labelPlacement="start"
            />
            <SearchBar value={searchQuery} onChange={handleSearchChange} />
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
                                <Post key={index} isLoading={true} />
                            ) : (
                                <Post
                                    key={obj._id}
                                    id={obj._id}
                                    title={obj.title}
                                    imageUrl={obj.imageUrl ? `${process.env.REACT_APP_API_URL}${obj.imageUrl}` : ''}
                                    user={obj.user}
                                    createdAt={convertToTimezone(obj.createdAt, timeZone)}
                                    viewsCount={obj.viewsCount}
                                    commentsCount={obj.comments?.length || 0}
                                    tags={obj.tags}
                                    isEditable={userData?._id === obj.user._id}
                                />
                            )
                        )
                    )}
                </Grid>
                <Grid xs={4} item>
                    <TagsBlock items={tags.items} isLoading={isTagsLoading} />
                </Grid>
            </Grid>
        </>
    );
};
