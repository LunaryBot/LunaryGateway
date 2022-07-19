import Eris from 'eris';
import fs from 'fs';

import EventListener from './EventListener';

class Lunary extends Eris.Client {
    public events: Array<EventListener>;

    constructor() {
        super(
            process.env.DISCORD_CLIENT_TOKEN, {
            intents: ['guilds', 'guildMembers', 'guildBans', 'guildIntegrations', 'guildWebhooks', 'guildVoiceStates', 'guildMessages', 'guildMessageReactions'],
            allowedMentions: {
                everyone: false,
                roles: false,
                users: true,
                repliedUser: true,
            },
            restMode: true,
            rest: {
                baseURL: '/api/v10'
            },
            messageLimit: 20,
            defaultImageFormat: 'png',
        });

        this.events = [];
    }

    private async _loadListeners(): Promise<EventListener[]> {
        const regex = /^(.*)Listener\.(t|j)s$/;
        let events = fs.readdirSync(__dirname + '/../events').filter(file => regex.test(file));

        const eventsName: Array<string> = [];
        for (let event of events) {
            const { default: base } = require(__dirname + `/../events/${event}`);
            
            const instance = new base(this) as EventListener;

            this.events.push(instance);

            eventsName.push(...instance.events);

            instance.listen.bind(instance)();
        };

        logger.info(`Loaded ${eventsName.length} events of ${events.length} files`, { label: `Cluster ${process.env.CLUSTER_ID ?? 0}, Lunary, Events`, details: `> ${eventsName.join(' | ')}` });

        return this.events;
    }

    async init() {
        await this._loadListeners();

        await this.connect();

        return this;
    }
}

export default Lunary;