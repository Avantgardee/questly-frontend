// services/websocket.js

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

        if (this.socket) {
            this.disconnect();
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

                // Повторно отправляем ожидающие сообщения
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
                console.log('WebSocket disconnected:', event.code, event.reason);

                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect(this.token);
                    }, delay);
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

        // Сохраняем сообщение для отправки после подключения, если сокет не открыт
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

    // Этот метод больше не используется клиентом, но оставлен на случай другой логики
    confirmMessageDelivery(messageId) {
        return this.sendMessage({
            type: 'MESSAGE_DELIVERED',
            data: { messageId }
        });
    }
}

export const webSocketService = new WebSocketService();