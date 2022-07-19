import Eris from 'eris';

import EventListener from '../structures/EventListener';

class RawWSListener extends EventListener {
    constructor(client: LunaryClient) {
        super(client, 'rawWS');
    }

    public async run(packet: Eris.RawPacket) {
        // console.log(packet)
    }
}

export default RawWSListener;