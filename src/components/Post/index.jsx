import React, { useState } from 'react';
import clsx from 'clsx';
import { Link } from "react-router-dom";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import EyeIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CommentIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import styles from './Post.module.scss';
import { UserInfo } from '../UserInfo';
import { PostSkeleton } from './Skeleton';
import { useDispatch } from "react-redux";
import { fetchRemovePost } from "../../redux/slices/posts";

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
                     }) => {
  const dispatch = useDispatch();
  const [openDialog, setOpenDialog] = useState(false);

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
      </div>
  );
};
