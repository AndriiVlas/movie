import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import logService from '../services/logService.js';


const URL = process.env.ELASTICSEARCH_URL;
const NAME = process.env.ELASTICSEARCH_USERNAME;
const PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

const INDEX = process.env.ELASTICSEARCH_INDEX;
const LOG_LEVEL = process.env.LOG_LEVEL;
const MAPPING = {
    index_patterns: ['movie-logs-*'],
    template: {
        mappings: {
            properties: {
                "@timestamp":   { type: "date" },
                "level":        { type: "keyword" },
                "message":      { type: "text" },
                "fields": {
                    properties: {
                        "logger_name":  { type: "keyword" },
                        "ip":           { type: "ip"},
                        "user_agent":   { type: "text" },
                        "method":       { type: "keyword" },
                        "url":          { type: "text" },
                        "status":       { type: "integer" },
                        "duration":     { type: "integer" },
                        "error_stack":  { type: "text" }
                    }
                }
            }
        }
    }
};


const esTransport = new ElasticsearchTransport({
    level: LOG_LEVEL,
    clientOpts: {
        node: URL,
        auth: {
            username: NAME,
            password: PASSWORD
        }
    },
    indexPrefix: INDEX,
    indexTemplate: MAPPING
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
        logService.serviceConnect('Elasticsearch');
    })
    .catch((error) => {
        console.error('Elasticsearch НЕ виконує логування:', error.message);
    });



export default logger;