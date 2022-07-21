import EventListener from '@EventListener';

class RawWSListener extends EventListener {
	constructor(client: LunaryClient) {
		super(client, 'ready');
	}

	public async on() {
		logger.info(`Bot is running on port ${this.client.user.username}#${this.client.user.discriminator} (ID: ${this.client.user.id})`, { label: 'Lunary' });

		// setTimeout(() => {
		// 	this.client.redis.get('guilds:777332295836368917').then(data => console.log(JSON.parse(data as string)));
		// }, 5000);
	}
}

export default RawWSListener;