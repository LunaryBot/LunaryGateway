import winston from 'winston';
import chalk from 'chalk';

const { printf, combine, timestamp, colorize } = winston.format; 

const config = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		debug: 5,
	},
	colors: {
		error: 'red',
		warn: 'yellowBG',
		info: 'green',
		http: 'blue',
		debug: 'yellow',
	},
};

winston.addColors(config.colors);

const logger = winston.createLogger({
	levels: config.levels,
	level: 'info',
	transports: [
		new winston.transports.Console({ 
			format: combine(
				colorize({ level: true }),
				winston.format.simple(),
				timestamp(),
				printf(({ level, message, label, timestamp = new Date().toISOString(), details }) => {
					return `${timestamp} ${level}  ${process.pid} --- ${label ? `[${chalk.cyan(label)}]:` : ''} ${message}${details ? `\n${details}` : ''}`;
				})
			),
		}),
		new winston.transports.File({ 
			filename: 'logs/combined.log',
			format: combine(
				winston.format.simple(),
				timestamp(),
				printf(({ level, message, label, timestamp = new Date().toISOString(), details }) => {
					return `${timestamp} ${level}  ${process.pid} --- ${label ? `[${label}]:` : ''} ${message}${details ? `\n${details}` : ''}`;
				})
			),
		}),
	],
	exitOnError: false,
});

global.logger = logger;