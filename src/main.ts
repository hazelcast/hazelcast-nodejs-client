'use strict';
import {Client, HazelcastSqlException} from '.';
import {SqlRowAsObject} from './sql/SqlResult';
import {SqlExpectedResultType} from './sql/SqlStatement';

const run = async function () {
    const client = await Client.newHazelcastClient();

    const testMap = await client.getMap('testMap');

    await testMap.clear();

    await testMap.put('a', -11.123);
    await testMap.put('b', 1);
    await testMap.put('c', 3);
    await testMap.put('d', 4);

    try {
        const res = client.getSqlService().execute('SELECT * FROM testMap WHERE this < ?', [2], {
            expectedResultType: 'ANY'
        });

        /*
        let next = await res.next();
        while(!next.done){
            console.log(next.value);
            next = await res.next();
        }
        */

        for await (const row of res) {
            console.log((row as SqlRowAsObject)['this']);
        }
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
