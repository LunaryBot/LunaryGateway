import { ClientEvents } from 'eris';

import Lunary from '../Lunary';

type Events = keyof ClientEvents;

class EventListener {
    public readonly client: Lunary;
    public readonly events: Array<Events>;
    
    constructor(client: Lunary, events: Events|Array<Events>) {
        this.client = client;

        this.events = Array.isArray(events) ?  events : [events];
    }

    listen() {
        this.events.map(eventName => {
            // @ts-ignore
            this.client.on(eventName, (...args) => this.run(...args));
        });
    }
}

export default EventListener;