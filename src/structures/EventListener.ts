import { ClientEvents } from 'eris';

type Events = keyof ClientEvents;

class EventListener {
    public readonly client: LunaryClient;
    public readonly events: Array<Events>;
    
    constructor(client: LunaryClient, events: Events|Array<Events>) {
        this.client = client;

        this.events = Array.isArray(events) ?  events : [events];
    }

    listen() {
        this.events.forEach(eventName => {
            // @ts-ignore
            this.client.on(eventName, (...args) => this.run(...args));
        });
    }
}

export default EventListener;