import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { fetchPostLikes } from '../../redux/slices/posts';
import { Link } from 'react-router-dom';
import styles from '../UserInfo/UserInfo.module.scss';

const LikesModal = ({ open, onClose, postId }) => {
  const dispatch = useDispatch();
  const likes = useSelector((state) => state.posts.postLikes.items[postId] || []);
  const pagination = useSelector((state) => state.posts.postLikes.pagination[postId]);
  const isLoadingMore = useSelector((state) => state.posts.postLikes.loadingMore);
  const hasMore = pagination?.hasMore || false;
  const observerTarget = useRef(null);
  const currentPageRef = useRef(1);

  useEffect(() => {
    if (open && postId) {
      currentPageRef.current = 1;
      dispatch(fetchPostLikes({ postId, page: 1, limit: 10, append: false }));
    }
  }, [open, postId, dispatch]);

  const loadMoreLikes = useCallback(() => {
    if (!isLoadingMore && hasMore && postId) {
      const nextPage = currentPageRef.current + 1;
      dispatch(fetchPostLikes({ postId, page: nextPage, limit: 10, append: true }));
      currentPageRef.current = nextPage;
    }
  }, [isLoadingMore, hasMore, postId, dispatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreLikes();
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
  }, [loadMoreLikes, hasMore, isLoadingMore]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Пользователи, которым понравился пост</DialogTitle>
      <DialogContent>
        {likes.length === 0 && !isLoadingMore ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
            Пока никто не поставил лайк
          </Typography>
        ) : (
          <List>
            {likes.map((user) => {
              const userId = typeof user === 'object' ? user._id : user;
              const userName = typeof user === 'object' ? user.fullName : 'Пользователь';
              const userAvatar = typeof user === 'object' ? user.avatarUrl : null;
              const userEmail = typeof user === 'object' ? user.email : '';

              return (
                <ListItem
                  key={userId}
                  component={Link}
                  to={`/profile/${userId}`}
                  className={styles.linkToUser}
                  sx={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={userAvatar ? `http://localhost:4444${userAvatar}` : '/noavatar.png'}
                      alt={userName}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={userName}
                    secondary={userEmail}
                  />
                </ListItem>
              );
            })}
            {isLoadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={observerTarget} style={{ height: '20px' }} />
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LikesModal;

