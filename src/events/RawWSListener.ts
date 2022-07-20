import Eris from 'eris';

import EventListener from '@EventListener';

class RawWSListener extends EventListener {
	constructor(client: LunaryClient) {
		super(client, 'rawWS');
	}

	public async on(packet: Eris.RawPacket) {
		// console.log(packet)
	}
}

export default RawWSListener;