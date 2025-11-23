class WebSocketService {
    constructor() {
        this.socket = null;
        this.messageHandlers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = null;
        this.token = null;
        this.pendingMessages = new Map();
    }

    connect(token) {
        this.token = token;

        // Если уже подключен и токен тот же, не переподключаемся
        if (this.socket && this.socket.readyState === WebSocket.OPEN && this.token === token) {
            console.log('WebSocket already connected');
            return;
        }

        // Если есть старое соединение, закрываем его
        if (this.socket) {
            // Удаляем старые обработчики перед закрытием
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.onmessage = null;
            if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
                this.socket.close();
            }
            this.socket = null;
        }

        if (!token) {
            console.error('No token provided for WebSocket connection');
            return;
        }

        try {
            this.socket = new WebSocket(`ws://localhost:8080?token=${token}`);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
                this.resendPendingMessages();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.messageHandlers.forEach(handler => handler(message));
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = (event) => {
                // Код 1005 - нормальное закрытие без кода статуса (например, при навигации браузера)
                // Код 1000 - нормальное закрытие
                // Не логируем их как ошибки
                if (event.code !== 1005 && event.code !== 1000) {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                }

                // Очищаем ссылку на сокет
                this.socket = null;

                // Переподключаемся если есть токен (даже при нормальном закрытии)
                // Это нужно для случаев, когда пользователь возвращается на страницу через историю браузера
                if (this.token && this.reconnectAttempts < this.maxReconnectAttempts) {
                    // При нормальном закрытии (1000, 1005) переподключаемся сразу
                    // При ошибке - с задержкой
                    const delay = (event.code === 1000 || event.code === 1005) 
                        ? 100 
                        : Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
                    
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        if (this.token) {
                            this.connect(this.token);
                        }
                    }, delay);
                } else if (!this.token) {
                    // Если нет токена, сбрасываем счетчик
                    this.reconnectAttempts = 0;
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }

    resendPendingMessages() {
        for (const [messageId, message] of this.pendingMessages) {
            this.sendMessage(message);
        }
        this.pendingMessages.clear();
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
                return false;
            }
        }

        if (message.type === 'SEND_MESSAGE' && message.data) {
            this.pendingMessages.set(message.data.chatId + Date.now(), message);
        }

        console.warn('WebSocket is not connected, message queued.');
        return false;
    }

    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    markMessageAsRead(messageId) {
        return this.sendMessage({
            type: 'READ_MESSAGE',
            data: { messageId }
        });
    }

    markChatAsRead(chatId) {
        return this.sendMessage({
            type: 'MARK_CHAT_AS_READ',
            data: { chatId }
        });
    }

    confirmMessageDelivery(messageId) {
        return this.sendMessage({
            type: 'MESSAGE_DELIVERED',
            data: { messageId }
        });
    }

    editMessage(messageId, text) {
        return this.sendMessage({
            type: 'EDIT_MESSAGE',
            data: { messageId, text }
        });
    }

    deleteMessage(messageId) {
        return this.sendMessage({
            type: 'DELETE_MESSAGE',
            data: { messageId }
        });
    }
}

export const webSocketService = new WebSocketService();