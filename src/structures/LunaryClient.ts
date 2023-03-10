import Eris from 'eris';
import fs from 'fs';
import _Redis from 'ioredis';

import EventListener from '@EventListener';
import CacheControl from './CacheControl';
import { Redis } from './redis';

class Lunary extends Eris.Client {
	public events: Array<EventListener> = [];
	public cache: _Redis = new _Redis(process.env.CACHE_URL, {
		connectTimeout: 3000,
	});

	public redis: Redis = new Redis(this);

	public cacheControl: CacheControl;

	public devs = ['452618703792766987', '343778106340802580'];

	constructor() {
		super(
			process.env.DISCORD_CLIENT_TOKEN, 
			{
				intents: ['guilds', 'guildMembers', 'guildBans', 'guildIntegrations', 'guildWebhooks', 'guildVoiceStates', 'guildMessages', 'guildMessageReactions'],
				allowedMentions: {
					everyone: false,
					roles: false,
					users: true,
					repliedUser: true,
				},
				restMode: true,
				rest: {
					baseURL: '/api/v10',
				},
				messageLimit: 20,
				defaultImageFormat: 'png',
			}
		);

		this.cacheControl = new CacheControl(this);
	}

	private async _loadListeners(): Promise<EventListener[]> {
		const regex = /^(.*)Listener\.(t|j)s$/;
		const events = fs.readdirSync(__dirname + '/../events').filter(file => regex.test(file));

		const eventsName: Array<string> = [];
		for(const event of events) {
			const { default: Base } = require(__dirname + `/../events/${event}`);
            
			const instance = new Base(this) as EventListener;

			this.events.push(instance);

			eventsName.push(...instance.events);

			instance.listen.bind(instance)();
		};

		logger.info(`Loaded ${eventsName.length} events of ${events.length} files`, { label: `Cluster ${process.env.CLUSTER_ID ?? 0}, Lunary, Events`, details: `> ${eventsName.join(' | ')}` });

		return this.events;
	}

	async init() {
		await this._loadListeners();

		await this.redis.connect();

		await this.connect();

		return this;
	}
}

export default Lunary;