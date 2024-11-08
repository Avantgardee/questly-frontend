import React, {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import { Link } from "react-router-dom";
import styles from './Header.module.scss';
import Container from '@mui/material/Container';
import { useDispatch, useSelector } from "react-redux";
import {fetchAuthMe, logout, selectIsAuth} from "../../redux/slices/auth";
import { Avatar } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import CreateIcon from '@mui/icons-material/Create';
import LogoutIcon from '@mui/icons-material/Logout';
import ConfirmDialog from "../confirmDialog";
import NotificationPopper from "../Notification/NotificationPopper";
import {fetchPosts, fetchTags} from "../../redux/slices/posts";
import {fetchNotifications} from "../../redux/slices/notification";  // Импортируем новый компонент

export const Header = () => {
  const isAuth = useSelector(selectIsAuth);
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.data);
  const [openDialog, setOpenDialog] = useState(false);
  const notificationsData = useSelector((state) => state.notification);
  const notifications = notificationsData.status ? notificationsData.items : [];
  const isNotificationsLoading = notificationsData.status === 'loading';

  useEffect(() => {
    // Выполняем сначала запросы для получения данных пользователя, постов и тегов
    dispatch(fetchAuthMe());
  }, [dispatch]);

// Отдельный useEffect для получения уведомлений после того, как пользователь будет загружен
  useEffect(() => {
    if (userData && userData._id) {
      dispatch(fetchNotifications(userData._id));
    }
  }, [dispatch, userData]);

  const handleClickOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirm = () => {
    setOpenDialog(false);
    dispatch(logout());
    window.localStorage.removeItem('token');
  };

  return (
      <div className={styles.root}>
        <Container maxWidth="lg">
          <div className={styles.inner}>
            <div className={styles.buttons}>
              <Link className={styles.logo} to="/" id="style-2" data-replace="Questly">
                <span>Questly</span>
              </Link>
              {userData ? (
                  <>
                    <Link className={styles.avatar} alt={userData.fullName} to={`/profile/${userData._id}`}>
                      <Avatar
                          className={styles.avatarImg}
                          alt={userData.fullName}
                          src={userData.avatarUrl ? `http://localhost:4444${userData.avatarUrl}` : '/noavatar.png'}
                      />
                      <div className={styles.avatarName}>{userData.fullName}</div>
                    </Link>
                  </>
              ) : (<></>)}
              <Link to="/users" className={styles.usersLink}>
                <PeopleIcon sx={{ color: "black" }} />
              </Link>
            </div>
            <div className={styles.buttons}>
              {isAuth ? (
                  <>
                    <Link to="/add-post">
                      <Button variant="contained" startIcon={<CreateIcon />}>Написать статью</Button>
                    </Link>
                    <Button onClick={handleClickOpenDialog} variant="contained" className={styles.out} color="out" startIcon={<LogoutIcon />}>
                      Выйти
                    </Button>
                    <ConfirmDialog
                        open={openDialog}
                        onClose={handleCloseDialog}
                        onConfirm={handleConfirm}
                    />
                    {/* Используем компонент NotificationPopper и передаем уведомления */}
                    {isNotificationsLoading ? <> </> : <NotificationPopper notifications={[...notifications.slice()].reverse()} />}
                  </>
              ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outlined">Войти</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="contained">Создать аккаунт</Button>
                    </Link>
                  </>
              )}
            </div>
          </div>
        </Container>
      </div>
  );
};
