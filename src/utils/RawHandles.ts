import CacheControl from '@structures/CacheControl';
import { 
	GatewayDispatchEvents,
	GatewayChannelCreateDispatch,
	GatewayChannelUpdateDispatch,
	GatewayChannelDeleteDispatch,
	GatewayGuildCreateDispatch,
	GatewayGuildUpdateDispatch,
	GatewayGuildDeleteDispatch,
	GatewayGuildRoleCreateDispatch,
	GatewayGuildRoleUpdateDispatch,
	GatewayGuildRoleDeleteDispatch,
	GatewayGuildMemberAddDispatch,
	GatewayGuildMemberUpdateDispatch,
	GatewayGuildMemberRemoveDispatch,
	GatewayMessageCreateDispatch,
	GatewayMessageUpdateDispatch,
	GatewayMessageDeleteDispatch,
	GatewayUserUpdateDispatch,
	APITextChannel,
	APIRole,
	APIMessage,
	APIGuild,
	APIGuildMember,
} from 'discord-api-types/v10';

type GatewayChannelEvents = GatewayChannelCreateDispatch | GatewayChannelUpdateDispatch | GatewayChannelDeleteDispatch;

type GatewayGuildEvents = GatewayGuildCreateDispatch | GatewayGuildUpdateDispatch | GatewayGuildDeleteDispatch;
type GatewayGuildRolesEvents = GatewayGuildRoleCreateDispatch | GatewayGuildRoleUpdateDispatch | GatewayGuildRoleDeleteDispatch;
type GatewayGuildMembersEvents = GatewayGuildMemberAddDispatch | GatewayGuildMemberUpdateDispatch | GatewayGuildMemberRemoveDispatch;

type GatewayMessageEvents = GatewayMessageCreateDispatch | GatewayMessageUpdateDispatch | GatewayMessageDeleteDispatch;


class RawHandles {
	public readonly client: LunaryClient;
    
	constructor(client: LunaryClient) {
		Object.defineProperty(this, 'client', {
			value: client,
			enumerable: false,
			writable: false,
		});
	}

	public async handleChannel(packet: GatewayChannelEvents) {
		const { guild_id: guildId, ...channel } = packet.d as APITextChannel;

		if(!guildId) {
			return;
		}

		const guild = await this.client.cacheControl.getGuild(guildId);

		const channels = guild.channels;

		const channelIndex = channels.findIndex(c => c.id === channel.id);

		if(channelIndex === -1) {
			channels.push(CacheControl.resolveChannels([channel])[0]);

			logger.info(`Channel ${channel.id} added to guild ${guildId}`);
		} else if(packet.t === GatewayDispatchEvents.ChannelUpdate) {
			channels[channelIndex] = CacheControl.resolveChannels([channel])[0];

			logger.info(`Channel ${channel.id} updated in guild ${guildId}`);
		} else if(packet.t === GatewayDispatchEvents.ChannelDelete) {
			channels.splice(channelIndex, 1);

			logger.info(`Channel ${channel.id} deleted from guild ${guildId}`);
		}

		await this.client.cacheControl.setGuildChannels(guildId, channels);
	}
    
	public async handleGuild(packet: GatewayGuildEvents) {
		const { t: type, d: guild } = packet;

		if(type === GatewayDispatchEvents.GuildDelete) {
			return await this.client.cacheControl.deleteGuild(guild.id);
		}

		const result = await this.client.cacheControl.setGuild(guild);

		if(type == GatewayDispatchEvents.GuildCreate && guild.members?.length > 0) {
			guild.members.forEach(member => this.client.cacheControl.setGuildMember(guild.id, member.user?.id as string, member));
		}

		return result;
	}

	public async handleGuildRoles(packet: GatewayGuildRolesEvents, guild?: APIGuild) {
		const { guild_id: guildId } = packet.d;

		let role: APIRole;

		if(packet.t === GatewayDispatchEvents.GuildRoleDelete) {
			role = { id: packet.d.role_id } as APIRole;
		} else {
			role = packet.d.role;
		}

		const roles = ((guild ?? JSON.parse((await this.client.redis.get(`guilds:${guildId}`).catch(() => null) || JSON.stringify({}))) ?? {}).roles ?? []) as Array<APIRole>;

		const roleIndex = roles.findIndex(r => r.id === role.id);

		if(roleIndex === -1) {
			roles.push(role);
		} else if(packet.t === GatewayDispatchEvents.GuildRoleUpdate) {
			roles[roleIndex] = role;
		} else if(packet.t === GatewayDispatchEvents.GuildRoleDelete) {
			roles.splice(roleIndex, 1);
		}

		await this.client.cacheControl.setGuildRoles(guildId, roles);
	}

	public async handleMessage(packet: GatewayMessageEvents) {
		const { channel_id: channelId, guild_id: guildId, ...message } = packet.d;

		const messages = JSON.parse((await this.client.redis.get(`channels:${channelId}:messages`).catch(() => null) || JSON.stringify([]))) as Array<APIMessage>;

		const messageIndex = messages.findIndex(m => m.id === message.id);

		if(messageIndex === -1 && packet.t != GatewayDispatchEvents.MessageCreate) return;

		let messageFinded = true;

		if(messageIndex !== -1 || packet.t == GatewayDispatchEvents.MessageCreate) {
			if(packet.t === GatewayDispatchEvents.MessageCreate) {
				messages.push(message as APIMessage);
			} else if(packet.t === GatewayDispatchEvents.MessageUpdate) {
				messages[messageIndex] = message as APIMessage;
			} else if(packet.t === GatewayDispatchEvents.MessageDelete) {
				messages.splice(messageIndex, 1);
			}
		} else {
			messageFinded = false;
		}

		if(packet.t != GatewayDispatchEvents.MessageDelete) {
			const { author } = message as APIMessage;

			await this.client.cacheControl.setUser(author);
		}

		if(!messageFinded) return;

		await this.client.cacheControl.setChannelMessages(channelId, messages);
	}

	public async handleUser(packet: GatewayUserUpdateDispatch) {
		const user = packet.d;

		await this.client.cacheControl.setUser(user);
	}

	public async handleGuildMember(packet: GatewayGuildMembersEvents) {
		const { guild_id: guildId, user, ...data } = packet.d;
		
		if(user) await this.client.cacheControl.setUser(user);

		switch (packet.t) {
			case GatewayDispatchEvents.GuildMemberAdd:
			case GatewayDispatchEvents.GuildMemberUpdate: {
				const member = data as APIGuildMember;

				await this.client.cacheControl.setGuildMember(guildId, user?.id as string, member);
				
				break;
			}

			case GatewayDispatchEvents.GuildMemberRemove: {
				await this.client.cacheControl.deleteGuildMember(guildId, user?.id as string);

				break;
			}
		}
	}
}

export default RawHandles;