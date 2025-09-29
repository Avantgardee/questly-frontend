import React, {useRef, useState} from "react";
import {Link, Navigate, useNavigate, useParams} from 'react-router-dom';
import { Post } from "../components/Post";
import { CommentsBlock } from "../components/CommentsBlock";
import axios from "../axios";
import ReactMarkdown from "react-markdown";
import SimpleMDE from 'react-simplemde-editor';
import {fetchCreateComment, fetchGetPostComments} from "../redux/slices/comments";
import {useDispatch, useSelector} from "react-redux";
import styles from "../components/AddComment/AddComment.module.scss";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {selectIsAuth} from "../redux/slices/auth";
import { formatInTimeZone } from 'date-fns-tz';
import 'easymde/dist/easymde.min.css';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const convertToTimezone = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd HH:mm:ss');
};

export const FullPost = () => {
    const isAuth = useSelector(selectIsAuth);
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.auth.data);
    const [data, setData] = React.useState();
    const [newComm, setNewComm] = React.useState(false);
    const [comments, setCommentsData] = React.useState([]);
     const [isLoading, setLoading] = React.useState(true);
    const [isComLoading, setComLoading] = React.useState(true);
    const textFieldRef = useRef(null);
    const {id} = useParams();
    const timeZone = 'Europe/Moscow';
    const params = useParams();
    const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
    const navigate = useNavigate();

    const getAllCommentsForPost = async () => {
        axios
            .get(`/posts/comments/${id}`)
            .then((res) => {
                setCommentsData(res.data);
                setComLoading(false);
                setNewComm(false);
            })
            .catch((err) =>
            {
                setShowNotFoundDialog(true);
            });
    }
    const handleSubmit = () => {
        try{
            const postId = params.id;
            dispatch(fetchCreateComment({postId,text}));
            setComment(' ');
            setNewComm(true);
            textFieldRef.current.value = '';
        }
        catch(error){
            console.log(error);
        }
    }

    const [text, setComment] = React.useState('');
    React.useEffect(() => {
        getAllCommentsForPost();
    }, [newComm]);


    React.useEffect(() => {
        axios
            .get(`/posts/${id}`)
            .then((res) => {
                setData(res.data);
                setLoading(false);
    })
            .catch((err) =>
            {
                setShowNotFoundDialog(true);
        });
    }, []);

    if(isLoading ){
        return (
            <>
            <Post isLoading={isLoading} isFullPost/>
        <Dialog open={showNotFoundDialog} onClose={() => navigate('/')}>
            <DialogTitle>Статья не найдена</DialogTitle>
            <DialogContent>Запрашиваемая статья не найдена. Пожалуйста, вернитесь на главную страницу.</DialogContent>
            <DialogActions>
                <Button onClick={() => navigate('/')}>OK</Button>
            </DialogActions>
        </Dialog>
            </>
        )
    }
  return (
      <>
          <Post
              id={data._id}
              title={data.title}
              imageUrl={data.imageUrl ? `http://localhost:4444${data.imageUrl}` : ''}
              user={data.user}
              createdAt={convertToTimezone(data.createdAt, timeZone)}
              viewsCount={data.viewsCount}
              commentsCount={data.comments?.length || 0}
              tags={data.tags}
              isFullPost
          >
              <ReactMarkdown children={data.text}/>
          </Post>

          <CommentsBlock
              items={comments}
              isLoading={isComLoading}
          >
          </CommentsBlock>


          {isAuth ? (
          <form onSubmit={e => e.preventDefault()}>
              <div className={styles.root}>
                  <Avatar
                      classes={{root: styles.avatar}}
                      src={userData.avatarUrl ? `http://localhost:4444${userData.avatarUrl}` : '/noavatar.png'}
                  />
                  <div className={styles.form}>
                      <TextField
                          label="Написать комментарий"
                          variant="outlined"
                          ref={textFieldRef}
                          maxRows={10}
                          value={text}
                          multiline
                          fullWidth
                          onChange={e => setComment(e.target.value)}
                      />
                      <Button type="submit" onClick={handleSubmit} variant="contained">Отправить</Button>
                  </div>
              </div>
          </form>):
          (<div>Только зарегестрированные пользователи могут оставлять комментарии</div>)
          }

      </>
  );
};
