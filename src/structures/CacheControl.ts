import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APITextChannel, APIUser } from 'discord-api-types/v10';

type Channel = Pick<APIChannel, 'id' | 'name' | 'type'> & { position?: number, parent_id?: string, nsfw?: boolean };
type Guild = Pick<APIGuild, 'id' | 'name' | 'icon' | 'features' | 'banner'> & { ownerId: string, roles: Array<Role>, channels: Array<Channel> };
type Role = Pick<APIRole, 'id' | 'name' | 'color' | 'hoist' | 'permissions' | 'position'>;

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
		
			this.setUser(message.author);

			return message;
		}).sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).slice(0, 20);

		await this.client.redis.set(`channels:${channelId}:messages`, JSON.stringify(resolvedMessages));
	}

	async deleteGuild(guildId: string) {
		await this.client.redis.del(`guilds:${guildId}`);
	}

	async getGuild(guildId: string): Promise<Guild> {
		const guild = await this.client.redis.get(`guilds:${guildId}`);

		if(!guild) {
			return null as any;
		}

		return JSON.parse(guild);
	}

	async setGuild(guild: (APIGuild & { channels?: Array<APIChannel> }) | Guild) {
		const resolvedGuild: Partial<Guild> = {
			id: guild.id,
			name: guild.name,
			icon: guild.icon,
			ownerId: (guild as Guild).ownerId ?? (guild as APIGuild).owner_id,
			features: guild.features,
			banner: guild.banner,
		};

		if(guild.roles) {
			resolvedGuild.roles = CacheControl.resolveRoles(guild.roles);
		}

		if(guild.channels) {
			resolvedGuild.channels = CacheControl.resolveChannels(guild.channels);
		}
        
		await this.client.redis.set(`guilds:${guild.id}`, JSON.stringify(resolvedGuild));
	}

	async setGuildChannels(guildId: string, channels: Array<APIChannel|Channel>, guild: Guild = null as any) {
		if(!guild) {
			guild = await this.getGuild(guildId);
		}

		const resolvedChannels = CacheControl.resolveChannels(channels);

		guild.channels = resolvedChannels;

		await this.setGuild(guild);
	}

	async setGuildMember(guildId: string, userId: string, member: APIGuildMember) {
		delete member.user;

		await this.client.redis.set(`guilds:${guildId}:members:${userId == this.client.user.id ? '@me' : userId}`, JSON.stringify(member));
	}
	
	async deleteGuildMember(guildId: string, userId: string) {
		await this.client.redis.del(`guilds:${guildId}:members:${userId}`);
	}

	async setGuildRoles(guildId: string, roles: Array<APIRole|Role>, guild: Guild = null as any) {
		if(!guild) {
			guild = await this.getGuild(guildId);
		}

		const resolvedRoles = CacheControl.resolveRoles(roles);

		guild.roles = resolvedRoles;

		await this.setGuild(guild);
	}

	async setUser(user: APIUser) {
		await this.client.redis.set(`users:${user.id}`, JSON.stringify(user));
	}

	static resolveChannels(channels: Array<APIChannel|Channel>) {
		return channels.map(channel => {
			const data: any = {
				id: channel.id,
				name: channel.name,
				type: channel.type,
			};

			if('nsfw' in channel) {
				data.nsfw = channel.nsfw ?? false;
			}

			if('parent_id' in channel) {
				data.parent_id = channel.parent_id;
			}

			if('position' in channel) {
				data.position = channel.position;
			}

			return data;
		});
	}
	
	static resolveRoles(roles: Array<APIRole|Role>) {
		return roles.map(role => {
			// @ts-ignore
			delete role.unicode_emoji;
			// @ts-ignore
			delete role.icon;
			// @ts-ignore
			delete role.tags;

			return role;
		});
	}
}

export default CacheControl;