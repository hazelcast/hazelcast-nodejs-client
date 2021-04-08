'use strict';
const {Client, HazelcastSqlException} = require('./lib');

const run = async function () {
    const client = await Client.newHazelcastClient();

    const testMap = await client.getMap('testMap');

    await testMap.clear();

    await testMap.put('a', new Date());
    await testMap.put('b', new Date());
    await testMap.put('c', new Date());
    await testMap.put('d', new Date());

    try {
        const res = client.getSqlService().execute('SELECT * FROM testMap WHERE this < ?', [new Date()]);

        for (let row = await res.next(); row !== undefined; row = await res.next()) {
            console.log(row);
        }

        /*
        for await (const row of res) {
            console.log(row);
        }
        */
    } catch (error) {
        if (error instanceof HazelcastSqlException) {
            console.log(error.message);
            console.log(error.cause);
            console.log(error.name);
            console.log(error.serverStackTrace);
            console.log(error.stack);
        }
    }

    await client.shutdown();
};

run().then(c => {
    console.log(c);
}).catch(err => {
    throw err;
});
