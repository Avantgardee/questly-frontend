import React from "react";
import { SideBlock } from "./SideBlock";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { formatInTimeZone } from 'date-fns-tz';
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Skeleton from "@mui/material/Skeleton";
import styles from "./UserInfo/UserInfo.module.scss";
import { Link } from "react-router-dom";

const convertToTimezone = (dateString, timeZone) => {
    return formatInTimeZone(new Date(dateString), timeZone, 'yyyy-MM-dd HH:mm:ss');
};

const timeZone = 'Europe/Moscow';

export const CommentsBlock = ({ items, isLoading }) => {
    return (
        <SideBlock title="Комментарии">
            <List>
                {(isLoading ? [...Array(5)] : items).map((obj, index) => (
                    <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                            <Link to={isLoading ? '#' : `/profile/${obj.user._id}`}>
                                <ListItemAvatar>
                                    {isLoading ? (
                                        <Skeleton variant="circular" width={40} height={40} />
                                    ) : (
                                        <Avatar alt={obj.user.fullName} src={obj.user.avatarUrl ? `http://localhost:4444${obj.user.avatarUrl}` : '/noavatar.png'} />
                                    )}
                                </ListItemAvatar>
                            </Link>
                            {isLoading ? (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <Skeleton variant="text" height={25} width={120} />
                                    <Skeleton variant="text" height={18} width={230} />
                                </div>
                            ) : (
                                <ListItemText
                                    primary={`${obj.user.fullName} - ${(convertToTimezone(obj.createdAt, timeZone))}`}
                                    secondary={obj.text}
                                />
                            )}
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))}
            </List>
        </SideBlock>
    );
};
