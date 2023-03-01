import { ChannelSchema, GuildSchema, RoleSchema } from '@utils/schemas';
import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APIUser } from 'discord-api-types/v10';

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

	async setChannelMessages(channelId: string, messages: Array<APIMessage & { guild_id?: string, member?: APIGuildMember }>) {
		const resolvedMessages: Message[] = (await Promise.all(messages.map(async message => {
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

			delete data.referenced_message;

			return data as Message;
		}))).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 20);

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
		const resolvedGuild: Partial<Guild> = GuildSchema.parse(guild) as any;
        
		await this.client.redis.set(`guilds:${guild.id}`, JSON.stringify(resolvedGuild));
	}

	async setGuildChannels(guildId: string, channels: Array<APIChannel|Channel>, guild: Guild = null as any) {
		if(!guild) {
			guild = await this.getGuild(guildId);
		}

		const resolvedChannels = ChannelSchema.parse(channels) as any;

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

		const resolvedRoles = RoleSchema.parse(roles) as any;

		guild.roles = resolvedRoles;

		await this.setGuild(guild);
	}

	async setUser(user: APIUser) {
		await this.client.redis.set(`users:${user.id}`, JSON.stringify(user));
	}
}

export default CacheControl;