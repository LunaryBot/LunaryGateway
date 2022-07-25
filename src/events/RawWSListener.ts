import Eris from 'eris';
import { GatewayDispatchEvents } from 'discord-api-types/v10';

import EventListener from '@EventListener';

import RawHandles from '@utils/RawHandles';

type PacketHandle = { packets: Array<GatewayDispatchEvents>, handler: (...args: any[]) => Promise<void> };

class RawWSListener extends EventListener {
	public readonly packetsHandle: Array<PacketHandle>;
	public readonly packetsName: Array<GatewayDispatchEvents>;
	public readonly rawHandle: RawHandles;

	constructor(client: LunaryClient) {
		super(client, 'rawWS');

		this.rawHandle = new RawHandles(client);

		this.packetsHandle = [
			{
				packets: [
					GatewayDispatchEvents.GuildCreate, 
					GatewayDispatchEvents.GuildUpdate, 
					GatewayDispatchEvents.GuildDelete,
				],
				handler: this.rawHandle.handleGuild.bind(this.rawHandle),
			},
			{
				packets: [
					GatewayDispatchEvents.ChannelCreate,
					GatewayDispatchEvents.ChannelUpdate,
					GatewayDispatchEvents.ChannelDelete,
				],
				handler: this.rawHandle.handleChannel.bind(this.rawHandle),
			},
			{
				packets: [
					GatewayDispatchEvents.GuildRoleCreate,
					GatewayDispatchEvents.GuildRoleUpdate,
					GatewayDispatchEvents.GuildRoleDelete,
				],
				handler: this.rawHandle.handleGuildRoles.bind(this.rawHandle),
			},
			{
				packets: [
					GatewayDispatchEvents.GuildMemberAdd,
					GatewayDispatchEvents.GuildMemberRemove,
					GatewayDispatchEvents.GuildMemberUpdate,
				],
				handler: this.rawHandle.handleGuildMember.bind(this.rawHandle),
			},
		];

		this.packetsName = this.packetsHandle.map(({ packets }) => packets).flat();
	}

	public async on(packet: Eris.RawPacket) {
		if(!this.packetsName.includes(packet.t as any)) return;

		const { handler } = this.packetsHandle.find(p => p.packets.includes(packet.t as any)) as PacketHandle;

		if(!handler) return;

		logger.info(`@${packet.t?.split(/$.|_/).map((x, i) => x.charAt(0).toUpperCase()+x.slice(1).toLowerCase()).join('')}`, { label: `${process.env.CLUSTER_ID ?? 0}, Lunary, RawWSListener` });

		await handler(packet);
	}
}

export default RawWSListener;