/**
 * The following file is used to validates correctness of
 * declarations (.d.ts) of the client library
 * produced by TypeScript compiler.
 */

import { Client } from '../../lib';

(async () => {
    const client = await Client.newHazelcastClient();
    const rb = await client.getRingbuffer('my-rb');
    await rb.add(1);
})();
