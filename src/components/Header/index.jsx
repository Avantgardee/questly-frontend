import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Button, Avatar, TextField, List, ListItem, ListItemText, Paper, CircularProgress, InputAdornment } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import CreateIcon from '@mui/icons-material/Create';
import LogoutIcon from '@mui/icons-material/Logout';
import MessageIcon from '@mui/icons-material/Message';
import SearchIcon from '@mui/icons-material/Search';
import styles from './Header.module.scss';
import { fetchAuthMe, logout, selectIsAuth } from "../../redux/slices/auth";
import { fetchNotifications, removeInvalidNotifications } from "../../redux/slices/notification";
import ConfirmDialog from "../confirmDialog";
import NotificationPopper from "../Notification/NotificationPopper";
import axios from '../../axios';
import { useDebounce } from '../../hooks/useDebounce';

export const Header = () => {
  const isAuth = useSelector(selectIsAuth);
  const userData = useSelector((state) => state.auth.data);
  const notificationsData = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [authChecked, setAuthChecked] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);


  useEffect(() => {
    dispatch(fetchAuthMe())
        .unwrap()
        .catch(() => console.log('Требуется авторизация'))
        .finally(() => setAuthChecked(true));
  }, [dispatch]);


  useEffect(() => {
    if (isAuth && userData?._id) {
      dispatch(fetchNotifications(userData._id));
    }
  }, [dispatch, isAuth, userData]);


  useEffect(() => {
    if (notificationsData.items.some(notif => notif.actionByUser === null)) {
      dispatch(removeInvalidNotifications());
    }
  }, [dispatch, notificationsData.items]);


  useEffect(() => {
    if (debouncedSearchTerm) {
      axios.post('/graphql', {
        query: `
          query Search($term: String!) {
            search(term: $term) {
              posts { _id title }
              users { _id fullName }
              messages { _id text chat }
            }
          }
        `,
        variables: { term: debouncedSearchTerm }
      }).then(response => {
        setSearchResults(response.data.data.search);
      }).catch(error => {
        console.error('Error during search:', error);
        setSearchResults(null);
      });
    } else {
      setSearchResults(null);
    }
  }, [debouncedSearchTerm]);



  const handleLogoutConfirm = async () => {
    try {
      await axios.post('/auth/logout');
      setOpenDialog(false);
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    }
  };

  const onSearchResultClick = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  if (!authChecked) {
    return (
        <header className={styles.root}>
          <Container maxWidth="lg">
            <div className={styles.inner}>
              <Link to="/" className={styles.logo} data-replace="Questly">
                <span>Questly</span>
              </Link>
              <div className={styles.loader}>
                <CircularProgress size={24} />
              </div>
            </div>
          </Container>
        </header>
    );
  }

  return (
      <header className={styles.root}>
        <Container maxWidth="lg">
          <div className={styles.inner}>
            {/* Левая часть: Лого, Аватар, Пользователи */}
            <div className={styles.leftSection}>
              <Link to="/" className={styles.logo} data-replace="Questly">
                <span>Questly</span>
              </Link>
              {isAuth && userData && (
                  <Link to={`/profile/${userData._id}`} className={styles.avatar}>
                    <Avatar
                        className={styles.avatarImg}
                        alt={userData.fullName}
                        src={userData.avatarUrl ? `http://localhost:4444${userData.avatarUrl}` : '/noavatar.png'}
                    />
                    <span className={styles.avatarName}>{userData.fullName}</span>
                  </Link>
              )}
              <Link to="/users" className={styles.iconButton} title="Все пользователи">
                <PeopleIcon />
              </Link>
            </div>

            <div className={styles.search}>
              <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Поиск по сайту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                    ),
                  }}
              />
              {searchResults && (
                  <Paper className={styles.searchResults}>
                    <List>
                      {searchResults.posts?.map(post => (
                          <ListItem key={post._id} button component={Link} to={`/posts/${post._id}`} onClick={onSearchResultClick}>
                            <ListItemText primary={post.title} secondary="Пост" />
                          </ListItem>
                      ))}
                      {searchResults.users?.map(user => (
                          <ListItem key={user._id} button component={Link} to={`/profile/${user._id}`} onClick={onSearchResultClick}>
                            <ListItemText primary={user.fullName} secondary="Пользователь" />
                          </ListItem>
                      ))}
                      {searchResults.messages?.map(message => (
                          <ListItem key={message._id} button component={Link} to={`/messages?chatId=${message.chat}&messageId=${message._id}`} onClick={onSearchResultClick}>
                            <ListItemText primary={`"${message.text}"`} secondary="Сообщение" />
                          </ListItem>
                      ))}
                    </List>
                  </Paper>
              )}
            </div>

            <div className={styles.rightSection}>
              {isAuth ? (
                  <>
                    <Button variant="outlined" startIcon={<MessageIcon />} onClick={() => navigate('/messages')}>
                      Сообщения
                    </Button>
                    <Button variant="contained" component={Link} to="/add-post" startIcon={<CreateIcon />}>
                      Написать
                    </Button>
                    <NotificationPopper notifications={[...notificationsData.items].reverse()} />
                    <Button onClick={() => setOpenDialog(true)} variant="contained" color="error" className={styles.logoutButton}>
                      <LogoutIcon />
                    </Button>
                    <ConfirmDialog
                        open={openDialog}
                        onClose={() => setOpenDialog(false)}
                        onConfirm={handleLogoutConfirm}
                        title="Подтверждение выхода"
                        message="Вы уверены, что хотите выйти?"
                    />
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
      </header>
  );
};