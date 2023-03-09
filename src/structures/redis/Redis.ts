import { createClient } from 'redis';

import { createRedisIndexes } from './RedisIndexes';

export class Redis {
	public ping = -1;
	public readonly connection = createClient({ url: process.env.REDIS_URL });
	private readonly client: LunaryClient;
	private interval?: NodeJS.Timer;

	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});

		this.connection
			.on('ready', async () => {
				await this.makePing();
				this.interval = setInterval(this.makePing.bind(this), 45000);
			})
			.on('error', (error: any) => {
				clearInterval(this.interval);
				this.interval = undefined;
			});
	}

	private async makePing() {
		const now = Date.now();

		await this.connection.ping();

		const time = Date.now() - now;

		this.ping = time;

		logger.debug(`Redis server acknowledged a ping in ${time}ms.`, {
			label: 'Redis',
		});

		return time;
	}

	createIndexes() {
		return createRedisIndexes(this);
	}

	connect() {
		return this.connection
			.connect()
			.catch((err: any) => logger.error(err, { tags: ['Error'] }));
	}
}