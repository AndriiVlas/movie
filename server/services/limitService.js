import redis from '../config/redis.js';
import crypto from 'crypto';



// Обмежувач кількості запитів
async function checkRateLimit(userIp, endpoint = 'global', limit = 5, windowTime = 60) {
    const r = redis.getRedis();
    
    if (!r) return true;

    const key = `requests_timestamps:${endpoint}:${userIp}`;
    const currentTime = Date.now();

    try {
        await r.zRemRangeByScore(key, 0, currentTime - windowTime * 1000);
        await r.zAdd(key, { score: currentTime, value: `${crypto.randomUUID()}` });
        await r.expire(key, windowTime);

        if (await r.zCard(key) > limit) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Помилка перевірки ліміту Redis:', error);
        return true;
    }
}

// Проміжна функція для обмежувача кількості запитів
async function rateLimiter(req, res, next) {
    const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
    const endpoint = req.path;

    if (!(await checkRateLimit(userIp, endpoint))) {
        return res.status(429).json({ message: 'Надіслано надто багато запитів до цього ресурсу' })
    }

    next();
}



export default { rateLimiter, redis };