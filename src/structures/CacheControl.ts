import { APIChannel, APIGuild, APIMessage, APIRole, APITextChannel, APIUser } from 'discord-api-types/v10';

class CacheControl {
	public readonly client: LunaryClient;
    
	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});
	}

	async setChannelMessages(channelId: string, messages: APIMessage[]) {
		const resolvedMessages = messages.map(message => {
			// @ts-ignore
			delete message.channel_id;

			delete message.interaction;

			return message;
		}).sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).slice(0, 20);

		await this.client.redis.set(`channels:${channelId}:messages`, JSON.stringify(resolvedMessages));
	}

	async deleteGuild(guildId: string) {
		await this.client.redis.del(`guilds:${guildId}`);
	}

	async setGuild(guild: APIGuild) {
		const resolvedGuild = {
			id: guild.id,
			name: guild.name,
			icon: guild.icon,
			ownerId: guild.owner_id,
			features: guild.features,
			banner: guild.banner,
		};
        
		await this.client.redis.set(`guilds:${guild.id}`, JSON.stringify(resolvedGuild));
	}

	async setGuildChannels(guildId: string, channels: APIChannel[]) {
		const resolvedChannels = channels.map(channel => {
			const data: any = {
				id: channel.id,
				name: channel.name,
				type: channel.type,
			};

			if('position' in channel) {
				data.position = channel.position;
			}

			if('nsfw' in channel) {
				data.nsfw = channel.nsfw ?? false;
			}

			return data;
		});

		await this.client.redis.set(`guilds:${guildId}:channels`, JSON.stringify(resolvedChannels));
	}

	async setGuildRoles(guildId: string, roles: APIRole[]) {
		const resolvedRoles = roles.map(role => {
			delete role.unicode_emoji;
			delete role.icon;
			delete role.tags;

			return role;
		});
        
		await this.client.redis.set(`guilds:${guildId}:roles`, JSON.stringify(resolvedRoles));
	}

	async setUser(user: APIUser) {
		await this.client.redis.set(`users:${user.id}`, JSON.stringify(user));
	}
}

export default CacheControl;