'use strict';
import {Client, HazelcastSqlException, Portable, PortableWriter, PortableReader} from '.';

class Customer implements Portable {
    factoryId: number;
    classId: number;

    constructor(private name: string, private age: number) {
        // Portable interface properties:
        this.factoryId = 1;
        this.classId = 1;
    }

    readPortable(reader: PortableReader) {
        this.name = reader.readString('name');
        this.age = reader.readDouble('id');
    }

    writePortable(writer: PortableWriter) {
        writer.writeString('name', this.name);
        writer.writeDouble('age', this.age);
    }
}

const run = async function () {
    const client = await Client.newHazelcastClient();

    const testMap = await client.getMap('testMap');

    await testMap.clear();

    await testMap.put('a', new Customer('a', 1));
    await testMap.put('b', new Customer('b', 2));
    await testMap.put('c', new Customer('c', 3));
    await testMap.put('d', new Customer('d', 4));

    try {
        const res = client.getSqlService().execute('SELECT * FROM testMap WHERE age > ?', [1]);

        /*
        let next = await res.next();
        while(!next.done){
            console.log(next.value);
            next = await res.next();
        }
        */

        for await (const row of res) {
            console.log(row);
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
