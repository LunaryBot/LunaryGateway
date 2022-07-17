declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Discord Client
            readonly DISCORD_CLIENT_TOKEN: string;
            readonly DISCORD_CLIENT_ID: string;

            readonly NODE_ENV: 'development' | 'production';
        }
    }
}
  
export {};