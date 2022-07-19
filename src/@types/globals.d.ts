import type { Logger } from 'winston';

import LunaryClient from '../structures/LunaryClient'

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Discord Client
            readonly DISCORD_CLIENT_TOKEN: string;
            readonly DISCORD_CLIENT_ID: string;

            readonly NODE_ENV: 'development' | 'production';
        }
    }

    var logger: Logger;

    type LunaryClient = LunaryClient;
}
  
export {};