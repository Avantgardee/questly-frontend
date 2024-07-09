import React from 'react';
import { TextField } from '@mui/material';
import { useDispatch } from 'react-redux';
import { filterSubs, resetFilter } from '../redux/slices/subs';

const SearchBarSubs = () => {
    const dispatch = useDispatch();

    const handleSearchChange = (event) => {
        const searchQuery = event.target.value;
        if (searchQuery) {
            dispatch(filterSubs(searchQuery));
        } else {
            dispatch(resetFilter());
        }
    };

    return (
        <TextField
            variant="outlined"
            fullWidth
            placeholder="Поиск по имени или email"
            onChange={handleSearchChange}
        />
    );
};

export default SearchBarSubs;
