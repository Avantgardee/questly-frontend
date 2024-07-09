import React from 'react';
import styles from './NotFound.module.scss';

const NotFound = () => {
    return (
        <div className={styles.not_found_container}>
            <div id={styles.clouds}>
                <div className={`${styles.cloud} ${styles.x1}`}></div>
                <div className={`${styles.cloud} ${styles.x1_5}`}></div>
                <div className={`${styles.cloud} ${styles.x2}`}></div>
                <div className={`${styles.cloud} ${styles.x3}`}></div>
                <div className={`${styles.cloud} ${styles.x4}`}></div>
                <div className={`${styles.cloud} ${styles.x5}`}></div>
            </div>
            <div className={styles.c}>
                <div className={styles._404}>404</div>
                <hr className={styles.line}/>
                <div className={styles._1}>Данная страница</div>
                <div className={styles._2}>не найдена</div>
                <a className={styles.btn} href="/">Вернуться на главную</a>
            </div>
        </div>
    );
};

export default NotFound;
