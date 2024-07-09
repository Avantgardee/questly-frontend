import React, { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import styles from './Login.module.scss';
import { useDispatch, useSelector } from "react-redux";
import {
    fetchRegisterData,
    fetchRegisterImage,
    selectIsAuth
} from "../../redux/slices/auth";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";

export const Registration = () => {
    const isAuth = useSelector(selectIsAuth);
    const dispatch = useDispatch();
    const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm({
        defaultValues: {
            fullName: 'Алиса Бобовна',
            email: 'testnew@test.ru',
            password: '12345',
        },
    });

    const [imageUrl, setImageUrl] = useState('');
    const inputFileRef = useRef(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleChangeFile = (event) => {
        setAvatarFile(event.target.files[0]);
    };

    const onClickRemoveImage = () => {
        setImageUrl('');
        setAvatarFile(null);
    };

    const onSubmit = async (values) => {
        try {
            const jsonResponse = await dispatch(fetchRegisterData(values));
            if (jsonResponse.payload.success) {
                window.localStorage.setItem('token', jsonResponse.payload.token);
                if (avatarFile) {
                    const formData = new FormData();
                    formData.append('image', avatarFile);
                    formData.append('userId', jsonResponse.payload.userId);
                    const imageResponse = await dispatch(fetchRegisterImage(formData));
                    if (imageResponse.payload.success) {
                        setMessage('Регистрация успешна!');
                        setSeverity('success');
                        setOpen(true);
                    } else {
                        setMessage('Не удалось загрузить изображение');
                        setSeverity('error');
                        setOpen(true);
                    }
                } else {
                    setMessage('Регистрация успешна!');
                    setSeverity('success');
                    setOpen(true);
                }
            } else {
                setMessage('Не удалось зарегистрироваться');
                setSeverity('error');
                setOpen(true);
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            setMessage('Ошибка регистрации');
            setSeverity('error');
            setOpen(true);
        }
    };

    if (isAuth) {
        return <Navigate to="/" />;
    }

    return (
        <Paper classes={{ root: styles.root }}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <Typography classes={{ root: styles.title }} variant="h5">
                    Создание аккаунта
                </Typography>

                <div className={styles.avatar}>
                    {avatarFile ? (
                        <Avatar src={URL.createObjectURL(avatarFile)} sx={{ width: 100, height: 100 }} />
                    ) : (
                        <Avatar sx={{ width: 100, height: 100 }} />
                    )}
                </div>

                <Button onClick={() => inputFileRef.current.click()} variant="outlined" size="large" className={styles.btn}>
                    Загрузить аватар
                </Button>

                <input ref={inputFileRef} type="file" onChange={handleChangeFile} hidden className={styles.btn} />

                {imageUrl && (
                    <>
                        <Button variant="contained" color="error" onClick={onClickRemoveImage}>
                            Удалить
                        </Button>
                        <img className={styles.image} src={`${process.env.REACT_APP_API_URL}${imageUrl}`} alt="Uploaded" />
                    </>
                )}

                <TextField
                    type="text"
                    error={Boolean(errors.fullName?.message)}
                    helperText={errors.fullName?.message}
                    {...register('fullName', { required: 'Укажите имя' })}
                    className={styles.field}
                    label="Полное имя"
                    fullWidth
                />
                <TextField
                    type="email"
                    error={Boolean(errors.email?.message)}
                    helperText={errors.email?.message}
                    {...register('email', { required: 'Укажите почту' })}
                    className={styles.field}
                    label="E-Mail"
                    fullWidth
                />
                <TextField
                    type="password"
                    error={Boolean(errors.password?.message)}
                    helperText={errors.password?.message}
                    {...register('password', { required: 'Укажите пароль' })}
                    className={styles.field}
                    label="Пароль"
                    fullWidth
                />
                <Button disabled={!isValid} type="submit" size="large" variant="contained" fullWidth>
                    Зарегистрироваться
                </Button>
            </form>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};
