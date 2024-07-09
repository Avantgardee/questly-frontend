import React, { useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Post } from '../components/Post';
import { fetchPostsWithTag, filterByComments, filterByViews, filterByCreatedAt, filterByTitle } from "../redux/slices/posts";
import { formatInTimeZone } from 'date-fns-tz';
import { useParams } from "react-router-dom";
import { FormControlLabel, Switch, Button, Typography, Grid } from "@mui/material";
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

    React.useEffect(() => {
        dispatch(fetchPostsWithTag(id));
    }, [dispatch, id]);

    const [checked, setChecked] = useState(true);
    const [activeTab, setActiveTab] = useState('createdAt');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (event) => {
        const searchNow = event.target.value;
        setSearchQuery(searchNow);
        dispatch(filterByTitle(searchNow));
    };

    const handleChange = (event) => {
        const newChecked = event.target.checked;
        setChecked(newChecked);
        handleTabChange(activeTab, newChecked);
    };

    const handleTabChange = (filterValue, direction) => {
        setActiveTab(filterValue);
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
                                    isEditable={userData?._id === obj.user._id}
                                />
                            )
                        )
                    )}
                </Grid>
            </Grid>
        </>
    );
};
