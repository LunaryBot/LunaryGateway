import { ClientEvents } from 'eris';

type Events = keyof ClientEvents;

class EventListener {
    public readonly client: LunaryClient;
    public readonly events: Array<Events>;
    public readonly multipleOnFunctions: boolean;
    
    constructor(client: LunaryClient, events: Events|Array<Events>, multipleOnFunctions = false) {
        this.client = client;

        this.events = Array.isArray(events) ?  events : [events];

        this.multipleOnFunctions = multipleOnFunctions;
    }

    listen() {
        this.events.forEach(eventName => {
            if(this.multipleOnFunctions) {
                // @ts-ignore
                this.client.on(eventName, (...args) => this[`on${eventName.toTitleCase()}`](...args));
            } else {
                // @ts-ignore
                this.client.on(eventName, (...args) => this.on(...args));  
            }
        });
    }
}

export default EventListener;