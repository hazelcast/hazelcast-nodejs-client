const {Client,HazelcastSqlException } = require('./lib');

const run = async function (){
    const client = await Client.newHazelcastClient();

    const testMap = await client.getMap('testMap');

    await testMap.clear();

    await testMap.put('a', 1);
    await testMap.put('b', 2);
    await testMap.put('c', 3);
    await testMap.put('d', 4);

    try {
        const res = client.getSqlService().execute('SELECT * FROM testMap WHERE this > ?', [2]);

        while(await res.hasNext()){
            const nextRow = await res.next();
            console.log(nextRow);
        }

        for await (const row of res){
            console.log(`row: ${row}`);
        }
    } catch (error) {
        if(error instanceof HazelcastSqlException){
            console.log(error.message);
            console.log(error.cause);
            console.log(error.name);
            console.log(error.serverStackTrace);
            console.log(error.stack);
        }
    }

    await client.shutdown();
}

run().then(c => {
    console.log(c);
}).catch(err => {
    throw err;
});
