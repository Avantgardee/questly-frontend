import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  Container, 
  Button, 
  Avatar, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Paper, 
  CircularProgress, 
  InputAdornment, 
  Typography, 
  Box, 
  Chip,
  ClickAwayListener
} from "@mui/material";
import ArticleIcon from '@mui/icons-material/Article';
import PersonIcon from '@mui/icons-material/Person';
import CommentIcon from '@mui/icons-material/Comment';
import MessageIcon from '@mui/icons-material/Message';
import PeopleIcon from '@mui/icons-material/People';
import CreateIcon from '@mui/icons-material/Create';
import LogoutIcon from '@mui/icons-material/Logout';
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
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef(null);

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
      setIsSearchLoading(true);
      axios.post('/graphql', {
        query: `
          query Search($term: String!) {
            search(term: $term) {
              posts { 
                _id 
                title 
                user {
                  _id
                  fullName
                  avatarUrl
                }
              }
              users { 
                _id 
                fullName 
                email 
                avatarUrl 
              }
              messages { 
                _id 
                text 
                chat 
              }
              comments {
                _id
                text
                postUrl
                user {
                  _id
                  fullName
                  avatarUrl
                }
              }
            }
          }
        `,
        variables: { term: debouncedSearchTerm }
      }).then(response => {
        console.log('Search response:', response.data);
        if (response.data && response.data.data && response.data.data.search) {
          setSearchResults(response.data.data.search);
        } else {
          console.error('Unexpected response format:', response.data);
          setSearchResults({ posts: [], users: [], messages: [] });
        }
      }).catch(error => {
        console.error('Error during search:', error);
        setSearchResults(null);
      }).finally(() => {
        setIsSearchLoading(false);
      });
    } else {
      setSearchResults(null);
      setIsSearchLoading(false);
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
    setIsSearchLoading(false);
  };

  const handleSearchClickAway = (event) => {
    // Не закрываем, если клик был внутри контейнера поиска (TextField или результаты)
    if (searchContainerRef.current && searchContainerRef.current.contains(event.target)) {
      return;
    }
    setSearchResults(null);
    setIsSearchLoading(false);
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

            <ClickAwayListener onClickAway={handleSearchClickAway}>
              <div className={styles.search} ref={searchContainerRef}>
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
                      )
                    }}
                />
                {(searchResults || isSearchLoading) && (
                    <Paper className={styles.searchResults} style={{ position: 'absolute', zIndex: 1000, width: '100%', maxHeight: '400px', overflow: 'auto' }}>
                      <List>
                        {isSearchLoading ? (
                          <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 3 }}>
                              <CircularProgress size={24} sx={{ mr: 2 }} />
                              <Typography variant="body2" color="text.secondary">
                                Поиск...
                              </Typography>
                            </Box>
                          </ListItem>
                        ) : !searchResults.posts?.length && !searchResults.users?.length && !searchResults.comments?.length && !searchResults.messages?.length ? (
                          <ListItem>
                            <ListItemText 
                              primary="Ничего не найдено" 
                              secondary="Попробуйте изменить поисковый запрос"
                              sx={{ textAlign: 'center', py: 2 }}
                            />
                          </ListItem>
                        ) : null}
                        {!isSearchLoading && searchResults && searchResults.comments?.map(comment => (
                            <ListItem 
                              key={comment._id} 
                              button 
                              component={Link} 
                              to={comment.postUrl || '#'} 
                              onClick={onSearchResultClick}
                              disabled={!comment.postUrl}
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  alt={comment.user?.fullName} 
                                  src={comment.user?.avatarUrl ? `http://localhost:4444${comment.user.avatarUrl}` : '/noavatar.png'}
                                />
                              </ListItemAvatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
                                <Typography variant="body1" noWrap sx={{ maxWidth: '100%' }}>
                                  {comment.text}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {comment.user?.fullName || 'Анонимный пользователь'}
                                </Typography>
                              </Box>
                              <Chip 
                                icon={<CommentIcon fontSize="small" />} 
                                label="Комментарий" 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                              />
                            </ListItem>
                        ))}
                        {!isSearchLoading && searchResults && searchResults.posts?.map(post => (
                            <ListItem key={post._id} button component={Link} to={`/posts/${post._id}`} onClick={onSearchResultClick}>
                              <ListItemAvatar>
                                <Avatar 
                                  alt={post.user?.fullName} 
                                  src={post.user?.avatarUrl ? `http://localhost:4444${post.user.avatarUrl}` : '/noavatar.png'}
                                />
                              </ListItemAvatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
                                <Typography variant="subtitle1" noWrap>{post.title}</Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {post.user?.fullName || 'Неизвестный автор'}
                                </Typography>
                              </Box>
                              <Chip 
                                icon={<ArticleIcon fontSize="small" />} 
                                label="Пост" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </ListItem>
                        ))}
                        {!isSearchLoading && searchResults && searchResults.users?.map(user => (
                            <ListItem key={user._id} button component={Link} to={`/profile/${user._id}`} onClick={onSearchResultClick}>
                              <ListItemAvatar>
                                <Avatar 
                                  alt={user.fullName} 
                                  src={user.avatarUrl ? `http://localhost:4444${user.avatarUrl}` : '/noavatar.png'}
                                />
                              </ListItemAvatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
                                <Typography variant="subtitle1" noWrap>{user.fullName}</Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {user.email}
                                </Typography>
                              </Box>
                              <Chip 
                                icon={<PersonIcon fontSize="small" />} 
                                label="Пользователь" 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            </ListItem>
                        ))}
                        {!isSearchLoading && searchResults && searchResults.messages?.map(message => (
                            <ListItem key={message._id} button component={Link} to={`/messages?chatId=${message.chat}&messageId=${message._id}`} onClick={onSearchResultClick}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <MessageIcon color="action" sx={{ mr: 2 }} />
                                <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
                                  <Typography variant="body1" noWrap sx={{ maxWidth: '100%' }}>
                                    {message.text}
                                  </Typography>
                                </Box>
                                <Chip 
                                  icon={<MessageIcon fontSize="small" />} 
                                  label="Сообщение" 
                                  size="small" 
                                  color="info" 
                                  variant="outlined"
                                />
                              </Box>
                            </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </div>
            </ClickAwayListener>

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