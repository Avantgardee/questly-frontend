import React, { useRef, useEffect } from 'react';
import { TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { setSearchQuery, fetchGetSubs, fetchGetAllUser } from '../redux/slices/subs';

const SearchBarSubs = () => {
    const dispatch = useDispatch();
    const { id, group } = useParams();
    const location = useLocation();
    const searchQuery = useSelector((state) => state.subs.searchQuery);
    const searchTimeoutRef = useRef(null);
    const isAllUsersPage = location.pathname === '/users' || (!id && !group);

    const handleSearchChange = (event) => {
        const searchNow = event.target.value;
        dispatch(setSearchQuery(searchNow));
    };

    // Выполняем поиск при изменении searchQuery
    useEffect(() => {
        // Очищаем предыдущий таймер
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Устанавливаем новый таймер для debounce (500ms)
        searchTimeoutRef.current = setTimeout(async () => {
            if (isAllUsersPage) {
                await dispatch(fetchGetAllUser({ page: 1, limit: 10, search: searchQuery, append: false }));
            } else if (id && group) {
                await dispatch(fetchGetSubs({ id, group, page: 1, limit: 10, search: searchQuery, append: false }));
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, id, group, isAllUsersPage, dispatch]);

    return (
        <TextField
            variant="outlined"
            fullWidth
            placeholder="Поиск по имени или email"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
        />
    );
};

export default SearchBarSubs;
