/**
 * The following file is used to validates correctness of
 * declarations (.d.ts) of the client library
 * produced by TypeScript compiler.
 */

import { Client, Long, int16 } from '../../lib';

(async (): Promise<void> => {
    const client = await Client.newHazelcastClient();
    const rb = await client.getRingbuffer('my-rb');
    await rb.add(1);
    const m = await client.getMap('my-map');
    await m.set(int16(42), 'universe');
    await m.set(Long.fromNumber(38), 'city');
})();
