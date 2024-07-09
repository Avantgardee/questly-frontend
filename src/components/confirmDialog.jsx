import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const ConfirmDialog = ({ open, onClose, onConfirm }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
            <DialogContentText>Вы хотите выйти?</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} color="primary">
                Отмена
            </Button>
            <Button onClick={onConfirm} color="primary" autoFocus>
                Выйти
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
