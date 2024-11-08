import React from 'react';
import styles from './UserInfo.module.scss';
import {Link} from "react-router-dom";
import {Avatar} from "@mui/material";
import {UserInfoSkeleton} from "./SkeletonProfile";


export const UserInfo = ({ avatarUrl, fullName, _id, additionalText, isLoading }) => {

  if (isLoading) {
    return <UserInfoSkeleton />;
  }
  return (
      <Link to={`/profile/${_id}`} className={styles.linkToUser}>
    <div className={styles.root}>

      <Avatar
          className={styles.avatar}
          alt={fullName}
          src={avatarUrl ? `http://localhost:4444${avatarUrl}` : '/noavatar.png'}
      />
      <div className={styles.userDetails}>
        <span className={styles.userName}>{fullName}</span>
        <span className={styles.additional}>{additionalText}</span>
      </div>
    </div>
      </Link>
  );
};
