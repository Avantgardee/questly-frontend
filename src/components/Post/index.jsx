import React, { useState } from 'react';
import clsx from 'clsx';
import { Link } from "react-router-dom";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import EyeIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CommentIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';

import styles from './Post.module.scss';
import { UserInfo } from '../UserInfo';
import { PostSkeleton } from './Skeleton';
import { useDispatch } from "react-redux";
import { fetchRemovePost, likePost, fetchPostLikes } from "../../redux/slices/posts";
import LikesModal from './LikesModal';

export const Post = ({
                       id,
                       title,
                       createdAt,
                       imageUrl,
                       user,
                       viewsCount,
                       commentsCount,
                       tags,
                       children,
                       isFullPost,
                       isLoading,
                       isEditable,
                       likes = [],
                       isLiked = false,
                       onLikeUpdate,
                     }) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.data);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLikesModal, setOpenLikesModal] = useState(false);
  const likesCount = likes?.length || 0;
  const isPostLiked = isLiked || (authUser && likes?.some(like => (typeof like === 'object' ? like._id : like) === authUser._id));

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmRemove = () => {
    dispatch(fetchRemovePost(id));
    setOpenDialog(false);
  };

  const handleLikeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (authUser) {
      try {
        const result = await dispatch(likePost(id)).unwrap();
        // Если передан callback для обновления данных (например, на странице FullPost)
        if (onLikeUpdate) {
          onLikeUpdate(result);
        }
      } catch (error) {
        console.error('Ошибка при лайке поста:', error);
      }
    }
  };

  const handleLikesRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (likesCount > 0) {
      setOpenLikesModal(true);
      dispatch(fetchPostLikes({ postId: id, page: 1, limit: 10, append: false }));
    }
  };

  const handleCloseLikesModal = () => {
    setOpenLikesModal(false);
  };

  if (isLoading) {
    return <PostSkeleton />;
  }

  return (
      <div className={clsx(styles.root, { [styles.rootFull]: isFullPost })}>
        {isEditable && (
            <div className={styles.editButtons}>
              <Link to={`/posts/${id}/edit`}>
                <IconButton color="primary">
                  <EditIcon />
                </IconButton>
              </Link>
              <IconButton onClick={handleOpenDialog} color="secondary">
                <DeleteIcon />
              </IconButton>
            </div>
        )}
        {imageUrl && (
            <img
                className={clsx(styles.image, { [styles.imageFull]: isFullPost })}
                src={imageUrl}
                alt={title}
            />
        )}
        <div className={styles.wrapper}>
          <UserInfo {...user} additionalText={createdAt} />
          <div className={styles.indention}>
            <h2 className={clsx(styles.title, { [styles.titleFull]: isFullPost })}>
              {isFullPost ? title : <Link to={`/posts/${id}`}>{title}</Link>}
            </h2>
            <ul className={styles.tags}>
              {tags.map((name) => (
                  <li key={name}>
                    <Link to={`/tags/${name}`}>#{name}</Link>
                  </li>
              ))}
            </ul>
            {children && <div className={styles.content}>{children}</div>}
            <ul className={styles.postDetails}>
              <li>
                <EyeIcon />
                <span>{viewsCount}</span>
              </li>
              <li>
                <CommentIcon />
                <span>{commentsCount}</span>
              </li>
              <li
                onClick={handleLikeClick}
                onContextMenu={handleLikesRightClick}
                style={{ cursor: 'pointer' }}
              >
                {isPostLiked ? (
                  <FavoriteIcon sx={{ color: 'red' }} />
                ) : (
                  <FavoriteBorderIcon />
                )}
                <span>{likesCount}</span>
              </li>
            </ul>
          </div>
        </div>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>Вы действительно хотите удалить статью?</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Отмена</Button>
            <Button onClick={handleConfirmRemove} color="secondary">Удалить</Button>
          </DialogActions>
        </Dialog>
        <LikesModal
          open={openLikesModal}
          onClose={handleCloseLikesModal}
          postId={id}
        />
      </div>
  );
};
