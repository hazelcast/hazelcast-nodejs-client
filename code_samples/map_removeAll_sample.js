'use strict';

const { Client, Predicate } = require('hazelcast-client');

(async () => {
    const client = await Client.newHazelcastClient();
    const map = await client.getMap('my-distributed-map');

    for (let i = 0; i < 10 ; i++) {
        await map.put('key' + i, i);
    }

    const predicate = new Predicate('this', Predicate.between('value', 3, 5));
    await map.removeAll(predicate);

    console.log(map.size());

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
