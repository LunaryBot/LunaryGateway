import { APIChannel, APIGuild, APIRole, APITextChannel } from 'discord-api-types/v10';

class CacheControl {
	public readonly client: LunaryClient;
    
	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});
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

	async deleteGuild(guildId: string) {
		await this.client.redis.del(`guilds:${guildId}`);
	}

	async setRoles(guildId: string, roles: APIRole[]) {
		const resolvedRoles = roles.map(role => {
			delete role.unicode_emoji;
			delete role.icon;
			delete role.tags;

			return role;
		});
        
		await this.client.redis.set(`guilds:${guildId}:roles`, JSON.stringify(resolvedRoles));
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
		});

		await this.client.redis.set(`guilds:${guildId}:channels`, JSON.stringify(resolvedChannels));
	}
}

export default CacheControl;