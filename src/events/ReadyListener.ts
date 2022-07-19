import EventListener from '@EventListener';

class RawWSListener extends EventListener {
    constructor(client: LunaryClient) {
        super(client, 'ready');
    }

    public async run() {
        logger.info(`Bot is running on port ${this.client.user.username}#${this.client.user.discriminator} (ID: ${this.client.user.id})`, { label: 'Lunary' });
    }
}

export default RawWSListener;