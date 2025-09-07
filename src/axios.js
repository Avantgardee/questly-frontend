import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4444',
    withCredentials: true,
});

// Переменная для отслеживания перенаправлений
let isRedirecting = false;

// Интерцептор для обработки 401 ошибки
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Проверяем, не находимся ли мы уже на странице логина
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

// Сбрасываем флаг перенаправления при изменении маршрута
const resetRedirectFlag = () => {
    isRedirecting = false;
};

// Добавляем обработчики для сброса флага
if (typeof window !== 'undefined') {
    // Обработчик для программной навигации (React Router и т.д.)
    const originalPushState = window.history.pushState;
    if (originalPushState) {
        window.history.pushState = function () {
            resetRedirectFlag();
            return originalPushState.apply(window.history, arguments);
        };
    }

    // Обработчик для браузерной навигации (кнопки назад/вперед)
    window.addEventListener('popstate', resetRedirectFlag);

    // Обработчик для изменения hash
    window.addEventListener('hashchange', resetRedirectFlag);
}

export default instance;