import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4444',
    withCredentials: true,
});
let isRedirecting = false;

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isOnLoginPage = window.location.pathname === '/login';
            const isOnRegisterPage = window.location.pathname === '/register';

            if (!isOnLoginPage && !isOnRegisterPage && !isRedirecting) {
                isRedirecting = true;
                window.localStorage.removeItem('userData');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const resetRedirectFlag = () => {
    isRedirecting = false;
};

if (typeof window !== 'undefined') {
    const originalPushState = window.history.pushState;
    if (originalPushState) {
        window.history.pushState = function () {
            resetRedirectFlag();
            return originalPushState.apply(window.history, arguments);
        };
    }

    window.addEventListener('popstate', resetRedirectFlag);

    window.addEventListener('hashchange', resetRedirectFlag);
}

export default instance;