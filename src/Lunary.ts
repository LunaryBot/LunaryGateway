import 'dotenv/config';

import Eris from 'eris';

class Lunary extends Eris.Client {
    constructor(token: string) {
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
    }

    async init() {
        await this.connect();

        return this;
    }
}

export default Lunary;