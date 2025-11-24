import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { SideBlock } from './SideBlock';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TagIcon from '@mui/icons-material/Tag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { fetchMostLikedPosts } from '../redux/slices/posts';

export const TagsBlock = ({ items, isLoading = true }) => {
    const dispatch = useDispatch();
    const mostLikedPosts = useSelector((state) => state.posts.mostLikedPosts.items);
    const isMostLikedLoading = useSelector((state) => state.posts.mostLikedPosts.status === 'loading');
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (activeTab === 1) {
            dispatch(fetchMostLikedPosts({ limit: 5 }));
        }
    }, [activeTab, dispatch]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <SideBlock title="Популярное">
            <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{ mb: 2 }}
            >
                <Tab label="Теги" />
                <Tab label="Лайки" />
            </Tabs>
            
            {activeTab === 0 ? (
                <List>
                    {(isLoading ? [...Array(5)] : items).map((obj, i) => (
                        <a
                            style={{ textDecoration: 'none', color: 'black' }}
                            href={`/tags/${isLoading ? i : obj.tag}`}
                            key={i}
                        >
                            <ListItem disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        <TagIcon />
                                    </ListItemIcon>
                                    {isLoading ? (
                                        <Skeleton width={100} />
                                    ) : (
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            width="100%"
                                        >
                                            <ListItemText primary={obj.tag} />
                                            <Typography variant="h6" color="textSecondary">
                                                {obj.count}
                                            </Typography>
                                        </Box>
                                    )}
                                </ListItemButton>
                            </ListItem>
                        </a>
                    ))}
                </List>
            ) : (
                <List>
                    {(isMostLikedLoading ? [...Array(5)] : mostLikedPosts).map((post, i) => (
                        <ListItem disablePadding key={isMostLikedLoading ? i : post._id}>
                            {isMostLikedLoading ? (
                                <ListItemButton disabled>
                                    <ListItemIcon>
                                        <FavoriteIcon />
                                    </ListItemIcon>
                                    <Skeleton width={200} />
                                </ListItemButton>
                            ) : (
                                <Link
                                    to={`/posts/${post._id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                                >
                                    <ListItemButton>
                                        <ListItemIcon>
                                            <FavoriteIcon sx={{ color: 'red' }} />
                                        </ListItemIcon>
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            width="100%"
                                        >
                                            <ListItemText 
                                                primary={post.title}
                                                primaryTypographyProps={{
                                                    style: {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '180px'
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                                <FavoriteIcon sx={{ fontSize: 16, color: 'red', mr: 0.5 }} />
                                                <Typography variant="body2" color="textSecondary">
                                                    {post.likesCount}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </ListItemButton>
                                </Link>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </SideBlock>
    );
};
