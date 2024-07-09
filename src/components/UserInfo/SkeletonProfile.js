import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { Link } from 'react-router-dom';
import { Avatar } from '@mui/material';
import styles from './UserInfo.module.scss';

export const UserInfoSkeleton = () => {
    return (
        <div className={styles.root}>
            <Skeleton variant="circular" width={40} height={40} className={styles.avatar} />
            <div className={styles.userDetails}>
                <Skeleton variant="text" width={100} height={20} className={styles.userName} />
                <Skeleton variant="text" width={150} height={15} className={styles.additional} />
            </div>
        </div>
    );
};