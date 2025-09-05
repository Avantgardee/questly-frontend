import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField,
    Box,
    IconButton,
    Chip,
    Snackbar,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Typography,
    CircularProgress
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, AttachFile as AttachFileIcon, Search as SearchIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from "../../axios";

const AddNoteDialog = ({ open, onClose, userId }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [notesHtml, setNotesHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [notesCount, setNotesCount] = useState(0);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const inputFileRef = useRef(null);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        if (open) {
            fetchNotes();
        }
    }, [open, searchQuery, filterCategory, currentPage]);

    const handleDeleteClick = (noteId) => {
        setNoteToDelete(noteId);
        setDeleteConfirmOpen(true);
    };

    const handleLoadPage = (page) => {
        setCurrentPage(page);
    };

    const handleDeleteConfirm = async () => {
        if (noteToDelete) {
            try {
                const response = await axios.delete(`/notes/${noteToDelete}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (response.data.success) {
                    showSnackbar('Заметка удалена', 'success');
                    fetchNotes();
                } else {
                    showSnackbar('Ошибка при удалении: ' + response.data.message, 'error');
                }
            } catch (error) {
                console.error('Ошибка при удалении заметки:', error);
                showSnackbar('Ошибка при удалении заметки', 'error');
            }
        }
        setDeleteConfirmOpen(false);
        setNoteToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setNoteToDelete(null);
    };

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (filterCategory) params.append('category', filterCategory);
            params.append('page', currentPage);
            params.append('limit', 10);

            const response = await axios.get(`/notes/${userId}/search?${params.toString()}`);

            if (response.data.success) {
                let processedHtml = response.data.notes;

                processedHtml = processedHtml.replace(/onclick="deleteNote\('([^']+)'\)"/g, (match, noteId) => {
                    return `onclick="window.deleteNoteHandler && window.deleteNoteHandler('${noteId}')"`;
                });

                processedHtml = processedHtml.replace(/onclick="loadPage\((\d+)\)"/g, (match, pageNum) => {
                    return `onclick="window.loadPageHandler && window.loadPageHandler(${pageNum})"`;
                });

                processedHtml = processedHtml.replace(/<script>[\s\S]*?<\/script>/g, '');

                setNotesHtml(processedHtml);
                setNotesCount(response.data.count);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Ошибка загрузки заметок:', error);
            showSnackbar('Ошибка загрузки заметок', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            window.deleteNoteHandler = handleDeleteClick;
            window.loadPageHandler = handleLoadPage;
        } else {
            delete window.deleteNoteHandler;
            delete window.loadPageHandler;
        }

        return () => {
            delete window.deleteNoteHandler;
            delete window.loadPageHandler;
        };
    }, [open]);

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleChangeFiles = (event) => {
        const files = Array.from(event.target.files);
        setAttachedFiles(prevFiles => [...prevFiles, ...files]);
    };

    const handleRemoveFile = (index) => {
        setAttachedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('category', data.category);
            formData.append('searchQuery', searchQuery);
            formData.append('filterCategory', filterCategory);

            const response = await axios.post(`/notes/${userId}/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success && attachedFiles.length > 0) {
                const filesFormData = new FormData();
                attachedFiles.forEach(file => {
                    filesFormData.append('files', file);
                });
                filesFormData.append('noteId', response.data.noteId);

                const filesResponse = await axios.post(`/notes/${userId}/upload-files`, filesFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (filesResponse.data.success) {
                    showSnackbar('Заметка успешно создана с файлами!', 'success');
                } else {
                    showSnackbar('Заметка создана, но возникла ошибка при загрузке файлов', 'warning');
                }
            } else if (response.data.success) {
                showSnackbar('Заметка успешно создана!', 'success');
            } else {
                showSnackbar('Не удалось создать заметку', 'error');
            }

            reset();
            setAttachedFiles([]);
            setCurrentPage(1);
            fetchNotes();
        } catch (error) {
            console.error('Ошибка создания заметки:', error);
            showSnackbar('Ошибка создания заметки', 'error');
        }
    };

    const handleClose = () => {
        reset();
        setAttachedFiles([]);
        setSearchQuery('');
        setFilterCategory('');
        setNotesHtml('');
        setCurrentPage(1);
        onClose();
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchNotes();
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setFilterCategory('');
        setCurrentPage(1);
        fetchNotes();
    };



    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { height: '90vh' } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Управление заметками</Typography>
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <Box sx={{ display: 'flex', height: '100%' }}>
                    <Box sx={{ width: '400px', borderRight: '1px solid #ddd', p: 2, overflowY: 'auto' }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <AddIcon sx={{ mr: 1 }} />
                            Создание заметки
                        </Typography>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Заголовок заметки"
                                        fullWidth
                                        size="small"
                                        {...register('title', { required: 'Укажите заголовок' })}
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Содержание заметки"
                                        fullWidth
                                        multiline
                                        rows={4}
                                        size="small"
                                        {...register('content', { required: 'Укажите содержание' })}
                                        error={!!errors.content}
                                        helperText={errors.content?.message}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Категория заметки</InputLabel>
                                        <Select
                                            {...register('category')}
                                            label="Категория заметки"
                                            defaultValue="other"
                                        >
                                            <MenuItem value="work">Работа</MenuItem>
                                            <MenuItem value="personal">Личное</MenuItem>
                                            <MenuItem value="ideas">Идеи</MenuItem>
                                            <MenuItem value="tasks">Задачи</MenuItem>
                                            <MenuItem value="other">Другое</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AttachFileIcon />}
                                            onClick={() => inputFileRef.current.click()}
                                            fullWidth
                                        >
                                            Прикрепить файлы
                                        </Button>
                                        <input
                                            ref={inputFileRef}
                                            type="file"
                                            multiple
                                            onChange={handleChangeFiles}
                                            hidden
                                        />
                                    </Box>

                                    {attachedFiles.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            {attachedFiles.map((file, index) => (
                                                <Chip
                                                    key={index}
                                                    label={file.name}
                                                    onDelete={() => handleRemoveFile(index)}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Grid>

                                <Grid item xs={12}>
                                    <Button type="submit" variant="contained" color="primary" fullWidth>
                                        Создать заметку
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <SearchIcon sx={{ mr: 1 }} />
                            Поиск и фильтрация
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Поиск по заметкам"
                                    fullWidth
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Введите текст для поиска..."
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Фильтр по категории</InputLabel>
                                    <Select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        label="Фильтр по категории"
                                    >
                                        <MenuItem value="">Все категории</MenuItem>
                                        <MenuItem value="work">Работа</MenuItem>
                                        <MenuItem value="personal">Личное</MenuItem>
                                        <MenuItem value="ideas">Идеи</MenuItem>
                                        <MenuItem value="tasks">Задачи</MenuItem>
                                        <MenuItem value="other">Другое</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSearch}
                                        fullWidth
                                    >
                                        Поиск
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleClearSearch}
                                        fullWidth
                                    >
                                        Сброс
                                    </Button>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    Найдено заметок: {notesCount}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom>
                            Мои заметки
                        </Typography>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : notesHtml ? (
                            <>
                                <Box
                                    dangerouslySetInnerHTML={{ __html: notesHtml }}
                                    sx={{
                                        '& .note-card': {
                                            transition: 'box-shadow 0.2s',
                                            '&:hover': {
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                                            }
                                        }
                                    }}
                                />

                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                Заметок не найдено. Создайте первую заметку!
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>Вы уверены, что хотите удалить эту заметку?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Отмена</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AddNoteDialog;