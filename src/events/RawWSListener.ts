import Eris from 'eris';
import { APIChannel, GatewayChannelCreateDispatchData, GatewayChannelUpdateDispatchData, GatewayDispatchEvents, GatewayGuildCreateDispatch, GatewayGuildCreateDispatchData, GatewayMessageCreateDispatchData } from 'discord-api-types/v10';

import EventListener from '@EventListener';

class RawWSListener extends EventListener {
	public readonly packetsName = [
		GatewayDispatchEvents.GuildCreate, 
		GatewayDispatchEvents.GuildUpdate, 
		GatewayDispatchEvents.GuildDelete,
		GatewayDispatchEvents.ChannelCreate,
		GatewayDispatchEvents.ChannelUpdate,
		GatewayDispatchEvents.ChannelDelete,
		GatewayDispatchEvents.MessageCreate,
		GatewayDispatchEvents.MessageUpdate,
		GatewayDispatchEvents.MessageDelete,
	];

	constructor(client: LunaryClient) {
		super(client, 'rawWS');
	}

	public async on(packet: Eris.RawPacket) {
		if(!packet.t || !this.packetsName.includes(packet.t as any)) return;

		// Guilds
		if([GatewayDispatchEvents.GuildCreate, GatewayDispatchEvents.GuildUpdate].includes(packet.t as any)) {
			await this.client.cacheControl.setGuild(packet.d as any);

			if(packet.t === GatewayDispatchEvents.GuildCreate) {
				const { id: guildId, channels } = packet.d as GatewayGuildCreateDispatchData;

				await this.client.cacheControl.setGuildChannels(guildId, channels);
			}

			console.log(`${packet.t}: ${(packet.d as any).name} (${(packet.d as any).id})`);
		}

		if(packet.t === GatewayDispatchEvents.GuildDelete) {
			await this.client.cacheControl.deleteGuild((packet.d as any).id);
			
			console.log(`${packet.t}: ${(packet.d as any).name} (${(packet.d as any).id})`);
		}

		// Channels
		if([GatewayDispatchEvents.ChannelCreate, GatewayDispatchEvents.ChannelUpdate].includes(packet.t as any)) {
			const guildId = (packet.d as any).guild_id;

			const channels = (await this.client.redis.get(`guilds:${guildId}:channels`) || []) as Array<APIChannel>;
			
			console.log(`${packet.t}: ${(packet.d as any).name} (${(packet.d as any).id})`);

			console.log(packet.d);

			const channel = (packet.d as GatewayChannelUpdateDispatchData);

			if(packet.t === GatewayDispatchEvents.ChannelUpdate) {
				const channelId = channel.id;
				const channelIndex = channels.findIndex(c => c.id === channelId);

				if(channelIndex === -1) return;

				channels[channelIndex] = channel;
			} else {
				channels.push(channel);
			}

			await this.client.cacheControl.setGuildChannels(guildId, channels);
		}

		if(packet.t === GatewayDispatchEvents.ChannelDelete) {
			const guildId = (packet.d as any).guild_id;

			const channels = (await this.client.redis.get(`guilds:${guildId}:channels`) || []) as Array<APIChannel>;
			
			const channelId = (packet.d as any).id;
			const channelIndex = channels.findIndex(c => c.id === channelId);

			if(channelIndex === -1) return;

			channels.splice(channelIndex, 1);

			await this.client.cacheControl.setGuildChannels(guildId, channels);
		}
	}
}

export default RawWSListener;