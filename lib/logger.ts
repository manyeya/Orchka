import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isInngest = !!process.env.INNGEST_EVENT_KEY || !!process.env.INNGEST_SIGNING_KEY;

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: (isDev && !isInngest)
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    browser: {
        asObject: true,
    }
});
