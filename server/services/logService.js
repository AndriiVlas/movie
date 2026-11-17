import logger from '../config/logger.js';


const systemLogger = logger.child({ logger_name: 'logger-system' }); // Логування системних подій
const accessLogger = logger.child({ logger_name: 'logger-access' }); // Логування звернень до ендпоїнтів


const logService = {
    /* systemLogger */
    // Логування під'єднання до БД або її падіння
    dbConnect(db, err = null) {
        if (err) {
            systemLogger.error(`Connect to ${db} – ERROR`, {
                error_stack: err.stack || err.message
            });
            return;
        }
        systemLogger.info(`Connect to ${db} – SUCCESS`);
    },

    // Логування під'єднання до сервісів або їх падіння
    serviceConnect(service, err = null) {
        if (err) {
            systemLogger.warn(`Connect to ${service} – ERROR`, {
                error_stack: err.stack || err.message
            });
            return;
        }
        systemLogger.info(`Connect to ${service} – SUCCESS`);
    },

    // Логування прослуховування порту
    serverListen(port, err = null) {
        if (err) {
            systemLogger.error(`Start the server on port ${port} — ERROR`, {
                error_stack: err.stack || err.message
            });
            return;
        }
        systemLogger.info(`Start the server on port ${port} — SUCCESS`)
    },


    /* accessLogger */
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
    }
}



export default logService;