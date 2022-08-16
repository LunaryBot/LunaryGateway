import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APIUser } from 'discord-api-types/v10';

type Channel = Pick<APIChannel, 'id' | 'name' | 'type'> & { position?: number, parent_id?: string, nsfw?: boolean };
type Guild = Pick<APIGuild, 'id' | 'name' | 'icon' | 'features' | 'banner'> & { owner_id: string, roles: Array<Role>, channels: Array<Channel> };
type Role = Pick<APIRole, 'id' | 'name' | 'color' | 'hoist' | 'permissions' | 'position'>;
type Message = Omit<APIMessage, 'activity' | 'application' | 'author' | 'channel_id' | 'interaction'> & { author_id: string, guild_id?: string };

class CacheControl {
	public readonly client: LunaryClient;
    
	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});
	}

	async setChannelMessages(channelId: string, messages: Array<APIMessage & { guild_id?: string, member?: APIGuildMember }>) {
		const resolvedMessages: Message[] = (await Promise.all(messages.map(async message => {
			const data = {
				...message,
				// @ts-ignore
				author_id: message.author_id || message.author.id,
			} as Partial<APIMessage> & { guild_id?: string,  member?: APIGuildMember };

			if(message.author) await this.setUser(message.author);

			if(message.guild_id && message.member) await this.setGuildMember(message.guild_id, message.author.id, message.member);
			
			delete data.activity;

			delete data.application;

			delete data.author;
			
			delete data.channel_id;

			delete data.interaction;
			
			delete data.member;

			delete data.nonce;

			return data as Message;
		}))).sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).slice(0, 20);

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
			owner_id: (guild as Guild).owner_id || (guild as APIGuild).owner_id as string,
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