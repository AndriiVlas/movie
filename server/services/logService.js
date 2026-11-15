import logger from '../config/logger.js';


const accessLogger = logger.child({ logger_name: 'logger-access' });
const eventsLogger = logger.child({ logger_name: 'logger-events' });
const dbLogger = logger.child({ logger_name: 'logger-database' });
const systemLogger = logger.child({ logger_name: 'logger-system' });


const logService = {
    // Логування запитів
    request(req, res, next) {
        const start = process.hrtime.bigint();
        res.on('finish', () => {
            const end = process.hrtime.bigint();
            accessLogger.info(`${req.method} ${req.url} – ${res.statusCode}`, {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                ip: req.ip,
                user_agent: req.get('user-agent'),
                duration: Number(end - start) / 1000000
            });
        })
        next();
    },

    // Логування під'єднання до БД
    dbConnect(db, err) {
        if (err) {
            systemLogger.error(`Connect to ${db} – ERROR`, {
                error_stack: err.stack || err.message
            });
            return;
        }
        systemLogger.info(`Connect to ${db} – SUCCESS`);
    }
}



export default logService;