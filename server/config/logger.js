import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';


const URL = process.env.ELASTICSEARCH_URL;
const INDEX = process.env.ELASTICSEARCH_INDEX;
const LOG_LEVEL = process.env.LOG_LEVEL;
const NAME = process.env.ELASTICSEARCH_USERNAME;
const PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

const esTransport = new ElasticsearchTransport({
    level: LOG_LEVEL,
    clientOpts: {
        node: URL,
        auth: {
            username: NAME,
            password: PASSWORD
        }
    },
    indexPrefix: INDEX
});

const logger = winston.createLogger({
    transports: [ esTransport ]
});

logger.on('error', (error) => {
    console.error('Помилка логера Elasticsearch: ', error.message);
});

esTransport.client.ping()
    .then(() => {
        console.log('Elasticsearch виконує логування');
    })
    .catch((error) => {
        console.error('Elasticsearch НЕ виконує логування:', error.message);
    });


export default logger;