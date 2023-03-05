import EventListener from '@EventListener';

class RawWSListener extends EventListener {
	constructor(client: LunaryClient) {
		// @ts-ignore
		super(client, ['ready', 'reconnecting', 'error', 'end'], true);
	}

	public async onReady() {
		logger.info('Connected to redis cache', { label: 'Redis' });
	}

	public async onReconnecting() {
		logger.debug('Reconnecting to the Redis cache', { label: 'Redis' });
	}

	public async onError(error: any) {
		logger.error(error, { label: 'Redis' });
	}

	public async onEnd() {
		logger.debug('Redis cache disconnected.', { label: 'Redis' });
	}

	public listen() {
		this.events.forEach(eventName => {
			if(this.multipleOnFunctions) {
				// @ts-ignore
				this.client.redis.connection.on(eventName, (...args) => this[`on${eventName.toTitleCase()}`](...args));
			} else {
				// @ts-ignore
				this.client.redis.connection.on(eventName, (...args) => this.on(...args));
			}
		});
	}
}

export default RawWSListener;