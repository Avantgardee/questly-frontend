import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchGetSubs } from '../redux/slices/subs';
import { Button, Grid, Card, CardContent, CardActions, Avatar, Typography, Box } from '@mui/material';
import axios from '../axios';
import styles from "../components/UserInfo/UserInfo.module.scss";
import SearchBarSubs from "../components/SearchSubs";

const SubscriptionsOrSubscribersPage = () => {
    const dispatch = useDispatch();
    const { id, group } = useParams();
    const subsItems = useSelector((state) => state.subs.filteredItems);
    const subsStatus = useSelector((state) => state.subs.status);
    const authUser = useSelector((state) => state.auth.data);
    const isSubsLoading = subsStatus === 'loading';

    useEffect(() => {
        dispatch(fetchGetSubs({ id, group }));
    }, [id, group, dispatch]);

    const handleSubscription = async (userId, isSubscribed) => {
        try {
            const url = isSubscribed ? `/profile/${userId}/unsubscribe` : `/profile/${userId}/subscribe`;
            const response = await axios.post(url, {});

            if (response.status === 200) {
                console.log(response.data.message);
                dispatch(fetchGetSubs({ id, group }));
            } else {
                console.error('Error subscribing/unsubscribing');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (subsStatus === 'error') {
        return <div>Error loading data</div>;
    }

    return (
        <Box sx={{ flexGrow: 1, padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                {group === 'subscriptions' ? 'Подписки' : 'Подписчики'}
            </Typography>
            <SearchBarSubs />
            <Grid container spacing={2}>
                {isSubsLoading ? (
                    [...Array(8)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Loading...</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    subsItems.map((user) => {
                        const isSubscribed = authUser && user.subscribers.includes(authUser._id);
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
                                <Card>
                                    <Link to={`/profile/${user._id}`} className={styles.linkToUser}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                                            <Avatar alt={user.fullName} src={user.avatarUrl ? `http://localhost:4444${user.avatarUrl}` : '/noavatar.png'} sx={{ width: 60, height: 60, mb: 2 }} />
                                            <Typography variant="h6" align="center">
                                                {user.fullName
                                                }
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" align="center">
                                                {user.email}
                                            </Typography>
                                        </CardContent>
                                    </Link>
                                    <CardActions sx={{ justifyContent: 'center' }}>
                                        {authUser && authUser._id !== user._id && (
                                            <Button
                                                variant="contained"
                                                color={isSubscribed ? 'secondary' : 'primary'}

                                                onClick={() => handleSubscription(user._id, isSubscribed)}
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
            </Grid>
        </Box>
    );
};

export default SubscriptionsOrSubscribersPage;
