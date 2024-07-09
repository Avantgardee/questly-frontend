import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import SimpleMDE from 'react-simplemde-editor';
import {Link, Navigate, useNavigate, useParams} from 'react-router-dom';
import 'easymde/dist/easymde.min.css';
import styles from './AddPost.module.scss';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/auth';
import axios from '../../axios';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export const AddPost = () => {
    const { id } = useParams();
    const isAuth = useSelector(selectIsAuth);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const inputFileRef = React.useRef(null);
    const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);

    const isEditing = Boolean(id);

    const handleChangeFile = async (event) => {
        try {
            const formData = new FormData();
            formData.append('image', event.target.files[0]);
            const { data } = await axios.post('/upload', formData);
            setImageUrl(data.url);
        } catch (err) {
            console.warn(err);
            setShowNotFoundDialog(true);
        }
    };

    const onClickRemoveImage = async () => {
        setImageUrl('');
    };

    const onChange = (value) => {
        setText(value);
    };

    const onSubmit = async () => {
        try {
            setIsLoading(true);

            const fields = {
                title,
                imageUrl,
                tags: tags.split(','),
                text,
            };

            const { data } = isEditing
                ? await axios.patch(`/posts/${id}`, fields)
                : await axios.post('/posts', fields);

            const _id = isEditing ? id : data._id;
            navigate(`/posts/${_id}`);
        } catch (err) {
            console.warn(err);
            setShowNotFoundDialog(true);
        }
    };

    React.useEffect(() => {
        if (id) {
            axios
                .get(`/posts/${id}`)
                .then(({ data }) => {
                    setTitle(data.title);
                    setText(data.text);
                    setTags(data.tags.join(','));
                    setImageUrl(data.imageUrl);
                })
                .catch((err) => {
                    console.log(err);
                    setShowNotFoundDialog(true);
                });
        }
    }, [id]);

    const options = React.useMemo(
        () => ({
            spellChecker: false,
            maxHeight: '400px',
            autofocus: true,
            placeholder: 'Введите текст...',
            status: false,
            autosave: {
                enabled: true,
                delay: 1000,
            },
        }),
        []
    );

    if (!window.localStorage.getItem('token') && !isAuth) {
        return <Navigate to="/" />;
    }

    return (
        <Paper style={{ padding: 30 }}>
            <Button onClick={() => inputFileRef.current.click()} variant="outlined" size="large">
                Загрузить превью
            </Button>
            <input ref={inputFileRef} type="file" onChange={handleChangeFile} hidden />
            {imageUrl && (
                <>
                    <Button variant="contained" color="error" onClick={onClickRemoveImage}>
                        Удалить
                    </Button>
                    <img className={styles.image} src={`http://localhost:4444${imageUrl}`} alt="Uploaded" />
                </>
            )}
            <br />
            <br />
            <TextField
                classes={{ root: styles.title }}
                variant="standard"
                placeholder="Заголовок статьи..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
            />
            <TextField
                classes={{ root: styles.tags }}
                variant="standard"
                placeholder="Тэги"
                value={tags}
                fullWidth
                onChange={(e) => setTags(e.target.value)}
            />
            <SimpleMDE className={styles.editor} value={text} onChange={onChange} options={options} />
            <div className={styles.buttons}>
                <Button size="large" variant="contained" onClick={onSubmit}>
                    {isEditing ? 'Обновить' : 'Опубликовать'}
                </Button>
                <Link to="/">
                    <Button size="large">Отмена</Button>
                </Link>
            </div>

            <Dialog open={showNotFoundDialog} onClose={() => navigate('/')}>
                <DialogTitle>Статья не найдена</DialogTitle>
                <DialogContent>Запрашиваемая статья не найдена. Пожалуйста, вернитесь на главную страницу.</DialogContent>
                <DialogActions>
                    <Button onClick={() => navigate('/')}>OK</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
