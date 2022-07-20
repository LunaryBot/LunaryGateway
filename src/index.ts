import 'dotenv/config';
import './tools/String';
import './tools/Logger';

import Lunary from './structures/LunaryClient';

async function main() {
    const client = new Lunary();

    await client.init();
}

main();
