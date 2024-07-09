import React from 'react';
import { SideBlock } from './SideBlock'; // Убедитесь, что путь правильный
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TagIcon from '@mui/icons-material/Tag';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const TagsBlock = ({ items, isLoading = true }) => {
    return (
        <SideBlock title="Тэги">
            <List>
                {(isLoading ? [...Array(5)] : items).map((obj, i) => (
                    <a
                        style={{ textDecoration: 'none', color: 'black' }}
                        href={`/tags/${isLoading ? i : obj.tag}`}
                        key={i}
                    >
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemIcon>
                                    <TagIcon />
                                </ListItemIcon>
                                {isLoading ? (
                                    <Skeleton width={100} />
                                ) : (
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        width="100%"
                                    >
                                        <ListItemText primary={obj.tag} />
                                        <Typography variant="h6" color="textSecondary">
                                            {obj.count}
                                        </Typography>
                                    </Box>
                                )}
                            </ListItemButton>
                        </ListItem>
                    </a>
                ))}
            </List>
        </SideBlock>
    );
};
