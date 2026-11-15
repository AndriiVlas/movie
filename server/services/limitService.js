import redis from '../config/redis.js';
import crypto from 'crypto';



// Обмежувач кількості запитів
async function checkRateLimit(redis, userIp, endpoint = 'global', limit = 5, windowTime = 60) {
    if (!redis) return true;

    const key = `requests_timestamps:${endpoint}:${userIp}`;
    const currentTime = Date.now();

    try {
        await redis.zRemRangeByScore(key, 0, currentTime - windowTime * 1000);
        await redis.zAdd(key, { score: currentTime, value: `${crypto.randomUUID()}` });
        await redis.expire(key, windowTime);

        if (await redis.zCard(key) > limit) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Помилка перевірки ліміту Redis:', error);
        return true;
    }
}

// Проміжна функція для обмежувача кількості запитів
async function rateLimiter(redis,req, res, next) {
    const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
    const endpoint = req.path;

    if (!(await checkRateLimit(redis, userIp, endpoint))) {
        return res.status(429).json({ message: 'Надіслано надто багато запитів до цього ресурсу' })
    }

    next();
}



export default { rateLimiter, redis };