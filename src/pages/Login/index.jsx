import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import styles from "./Login.module.scss";
import {fetchAuth, fetchAuthMe, selectIsAuth} from "../../redux/slices/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

export const Login = () => {
    const isAuth = useSelector(selectIsAuth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm({
        defaultValues: {
            email: 'test@test.ru',
            password: '55555',
        },
    });

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Проверяем авторизацию при загрузке компонента
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await dispatch(fetchAuthMe()).unwrap();
            } catch (error) {
                // Ожидаемая ошибка - пользователь не авторизован
                console.log('Пользователь не авторизован');
            } finally {
                setAuthChecked(true);
            }
        };

        checkAuth();
    }, [dispatch]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const onSubmit = async (values) => {
        try {
            setIsLoading(true);
            const data = await dispatch(fetchAuth(values));

            if (data.payload && data.payload._id) {
                navigate('/');
            } else {
                setMessage('Не удалось авторизоваться');
                setOpen(true);
            }
        } catch (error) {
            setMessage('Ошибка при авторизации');
            setOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Показываем loader пока проверяем авторизацию
    if (!authChecked) {
        return (
            <Paper classes={{ root: styles.root }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (isAuth) {
        return <Navigate to="/" />;
    }

    return (
        <Paper classes={{ root: styles.root }}>
            <Typography classes={{ root: styles.title }} variant="h5">
                Вход в аккаунт
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    className={styles.field}
                    label="E-Mail"
                    type="email"
                    error={Boolean(errors.email?.message)}
                    helperText={errors.email?.message}
                    {...register('email', { required: 'Укажите почту' })}
                    fullWidth
                    disabled={isLoading}
                />
                <TextField
                    className={styles.field}
                    label="Пароль"
                    type="password"
                    error={Boolean(errors.password?.message)}
                    helperText={errors.password?.message}
                    {...register('password', { required: 'Укажите пароль' })}
                    fullWidth
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    size="large"
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Войти'}
                </Button>
            </form>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};