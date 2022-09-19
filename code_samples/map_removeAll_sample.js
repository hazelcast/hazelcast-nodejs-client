'use strict';

const { Client, Predicates } = require('../lib/index');

(async () => {
    const client = await Client.newHazelcastClient();
    const map = await client.getMap('my-distributed-map');

    for (let i = 0; i < 10 ; i++) {
        await map.put('key' + i, i);
    }
    console.log('Map size before removing:', await map.size());

    const predicate = Predicates.between('this', 3, 7);
    await map.removeAll(predicate);

    console.log('Map size after removing:', await map.size());

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
