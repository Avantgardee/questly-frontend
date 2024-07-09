import React, { useEffect, useState, useRef } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField,
    Avatar,
    Box,
    Snackbar,
    Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import axios from "../axios";
import { useParams } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";

const convertToDateBirth = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd');
};

const timeZone = 'Europe/Moscow';

const EditProfileDialog = ({ open, onClose, userData }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            fullName: userData.fullName,
            birthDate: userData.birthDate,
            bio: userData.bio,
        },
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
    const inputFileRef = useRef(null);
    const { id } = useParams();

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        if (open) {
            reset({
                fullName: userData.fullName,
                birthDate: convertToDateBirth(userData.birthDate, timeZone),
                bio: userData.bio,
            });
            setAvatarFile(null);
            setIsAvatarRemoved(false);
        }
    }, [open, userData, reset]);

    const handleChangeFile = (event) => {
        setAvatarFile(event.target.files[0]);
        setIsAvatarRemoved(false);
    };

    const handleRemoveFile = () => {
        setAvatarFile(null);
        setIsAvatarRemoved(true);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const onSubmit = async (values) => {
        try {
            const response = await axios.patch(`/profile/${id}/editData`, values);
            if (response.data.success) {
                if (avatarFile !== null) {
                    const formData = new FormData();
                    formData.append('image', avatarFile);
                    const imageResponse = await axios.patch(`/profile/${id}/editImage`, formData);
                    if (imageResponse.data.success) {
                        showSnackbar('Профиль успешно обновлен!', 'success');
                    } else {
                        showSnackbar('Не удалось загрузить изображение', 'error');
                    }
                } else if (isAvatarRemoved) {
                    await axios.patch(`/profile/${id}/editImage`);
                    showSnackbar('Профиль успешно обновлен!', 'success');
                } else {
                    showSnackbar('Профиль успешно обновлен!', 'success');
                }
            } else {
                showSnackbar('Не удалось обновить профиль', 'error');
            }
            onClose();
        } catch (error) {
            console.error('Ошибка обновления профиля:', error);
            showSnackbar('Ошибка обновления профиля', 'error');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Изменить профиль</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        {avatarFile ? (
                            <Avatar src={URL.createObjectURL(avatarFile)} sx={{ width: 100, height: 100 }} />
                        ) : (
                            <Avatar
                                src={isAvatarRemoved || !userData.avatarUrl ? '/noavatar.png' : `http://localhost:4444${userData.avatarUrl}`}
                                sx={{ width: 100, height: 100 }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Button onClick={() => inputFileRef.current.click()} variant="outlined" fullWidth>
                            Загрузить новое фото
                        </Button>
                        <Button onClick={handleRemoveFile} variant="outlined" color="secondary" fullWidth sx={{ ml: 1 }}>
                            Удалить фото
                        </Button>
                    </Box>
                    <input ref={inputFileRef} type="file" onChange={handleChangeFile} hidden />
                    <TextField
                        label="Имя профиля"
                        fullWidth
                        margin="normal"
                        {...register('fullName', { required: 'Укажите имя' })}
                        error={!!errors.fullName}
                        helperText={errors.fullName?.message}
                    />
                    <TextField
                        label="Дата рождения"
                        type="date"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        {...register('birthDate', { required: 'Укажите дату рождения' })}
                        error={!!errors.birthDate}
                        helperText={errors.birthDate?.message}
                    />
                    <TextField
                        label="О себе"
                        fullWidth
                        margin="normal"
                        {...register('bio')}
                        error={!!errors.bio}
                        helperText={errors.bio?.message}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Отмена</Button>
                    <Button type="submit" variant="contained" color="primary">Сохранить</Button>
                </DialogActions>
            </form>
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default EditProfileDialog;
