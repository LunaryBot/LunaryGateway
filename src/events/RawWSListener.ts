import Eris from 'eris';

import Lunary from '../Lunary';
import EventListener from '../structures/EventListener';

class RawWSListener extends EventListener {
    constructor(client: Lunary) {
        super(client, 'rawWS');
    }

    public async run(packet: Eris.RawPacket) {
        console.log(packet)
    }
}

export default RawWSListener;