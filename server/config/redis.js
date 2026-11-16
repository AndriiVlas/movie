import { createClient } from "redis";
import logService from "../services/logService.js";


const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                return new Error('Перевищено ліміт спроб підключення до Redis');
            }
        }
    }
});

client.on('error', (error) => {
    logService.serviceConnect('Redis', error);
    console.error('Помилка клієнта Redis:', error.message);
});

async function connectRedis() {
    try {
        await client.connect();
        logService.serviceConnect('Redis');
        console.log('Redis успішно підключено');
    } catch (error) {
        logService.serviceConnect('Redis', error);
        console.error('Redis НЕ вдалося підключити. Робота продовжуються без кешу:', error.message);
    }
}

function getRedis() {
    if (!client || !client.isOpen) {
        return null;
    }
    return client;
}


export default {
    connectRedis,
    getRedis
};