import type { Logger } from 'winston';

import _LunaryClient from '../structures/LunaryClient';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Discord Client
            readonly DISCORD_CLIENT_TOKEN: string;
            readonly DISCORD_CLIENT_ID: string;

            // Redis
            readonly REDIS_URL: string;
            readonly CACHE_URL: string;

            readonly NODE_ENV: 'development' | 'production';
        }
    }

    interface String {
        shorten(length: number): string;
        toTitleCase(): string;
        checkSimilarityStrings(string: string): number;
    }

    var logger: Logger;

    type LunaryClient = _LunaryClient;
}
  
export {};