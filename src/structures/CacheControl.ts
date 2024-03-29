import { ChannelSchema, GuildSchema, RoleSchema } from '@utils/schemas';
import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APIUser } from 'discord-api-types/v10';

import { MessageSchema } from '@utils/schemas/Message/MessageSchema';

type Channel = Pick<APIChannel, 'id' | 'name' | 'type'> & { position?: number, parent_id?: string, nsfw?: boolean };
type Guild = Pick<APIGuild, 'id' | 'name' | 'icon' | 'features' | 'banner'> & { owner_id: string, roles: Array<Role>, channels: Array<Channel> };
type Role = Pick<APIRole, 'id' | 'name' | 'color' | 'hoist' | 'permissions' | 'position'>;
type Message = Omit<APIMessage, 'activity' | 'application' | 'author' | 'channel_id' | 'interaction' | 'referenced_message'> & { author_id: string, guild_id?: string };

class CacheControl {
	public readonly client: LunaryClient;
    
	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});
	}

	async setChannelMessages(channelId: string, message: APIMessage & { guild_id?: string, member?: APIGuildMember }) {
		const data = {
			...message,
			// @ts-ignore
			author_id: message.author_id || message.author.id,
		} as Partial<APIMessage> & { guild_id?: string,  member?: APIGuildMember };

		if(message.author) await this.setUser(message.author);

		if(message.guild_id && message.member) await this.setGuildMember(message.guild_id, message.author.id, message.member);

		if(data.referenced_message) {
			const { referenced_message } = data;

			data.referenced_message = {
				content: referenced_message.content,
				author_id: referenced_message.author.id,
				attachments: referenced_message.attachments,
				embeds: referenced_message.embeds,
				id: referenced_message.id,
				author: referenced_message.author,
			} as APIMessage & { author_id: string };

			await this.setUser(referenced_message.author);
		}
		
		delete data.activity;

		delete data.application;

		delete data.author;
		
		delete data.channel_id;

		delete data.interaction;
		
		delete data.member;

		delete data.nonce;

		const chachedMessages: { [id: string]: typeof message } = await this.client.redis.connection.json.get(`channels:${channelId}:messages`) as any;

		if(!chachedMessages) {
			return await this.client.redis.connection.json.set(`channels:${channelId}:messages`, '$', { [message.id]: data } as any);
		}

		await this.client.redis.connection.json.set(`channels:${channelId}:messages`, '$', Object.fromEntries(
			([
				[data.id, data] as [string, typeof message],
				...Object.entries(chachedMessages),
			]).sort(([id, message]) => Date.parse(message.timestamp) - Date.parse(message.timestamp)).slice(0, 20)
		) as any);
	}

	async deleteGuild(guildId: string) {
		await this.client.cache.del(`guilds:${guildId}`);
	}

	getGuild(guildId: string): Promise<Guild> {
		return this.client.redis.connection.json.get(`guilds:${guildId}`) as Promise<Guild>;
	}

	async setGuild(guild: (APIGuild & { channels?: Array<APIChannel> }) | Guild) {
		const resolvedGuild: Partial<Guild> = GuildSchema.parse(guild) as any;
        
		await this.client.redis.connection.json.set(`guilds:${guild.id}`, '$', resolvedGuild);
	}

	async setGuildChannels(guildId: string, channels: Array<APIChannel|Channel>) {
		const resolvedChannels = channels.map(channel => ChannelSchema.parse(channel)) as any;

		await this.client.redis.connection.json.set(`guilds:${guildId}`, '$.channels', resolvedChannels); 
	}

	async setGuildMember(guildId: string, userId: string, member: APIGuildMember) {
		delete member.user;

		await this.client.cache.set(`guilds:${guildId}:members:${userId == this.client.user.id ? '@me' : userId}`, JSON.stringify(member));
	}
	
	async deleteGuildMember(guildId: string, userId: string) {
		await this.client.cache.del(`guilds:${guildId}:members:${userId}`);
	}

	async setGuildRoles(guildId: string, roles: Array<APIRole|Role>, guild: Guild = null as any) {
		if(!guild) {
			guild = await this.getGuild(guildId);
		}

		const resolvedRoles = RoleSchema.parse(roles) as any;

		guild.roles = resolvedRoles;

		await this.setGuild(guild);
	}

	async setUser(user: APIUser) {
		await this.client.cache.set(`users:${user.id}`, JSON.stringify(user));
	}
}

export default CacheControl;