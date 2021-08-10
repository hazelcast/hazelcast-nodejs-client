'use strict';
const { Client, Predicates } = require('hazelcast-client');

class Comparator {
    constructor() {
        this.factoryId = 66;
        this.classId = 103;
    }

    sort(a, b) {
        if (a[1] > b[1]) {
            return -1;
        }
        if (a[1] < b[1]) {
            return 1;
        }
        return 0;
    }

    readData() {
        // no-op
    }

    writeData() {
        // no-op
    }
}

(async () => {
    const client = await Client.newHazelcastClient({
        serialization: {
            dataSerializableFactories: {
                66: (classId) => {
                    if (classId === 103) {
                        return new Comparator();
                    }
                    return null;
                }
            }
        }
    });
    const map = await client.getMap('my-maps');
    await map.setAll([
        ['one', 1],
        ['two', 2],
        ['three', 3],
        ['four', 4],
        ['five', 5],
        ['six', 6],
        ['seven', 7]
    ].sort(() => 0.5 - Math.random())); // shuffle entries
    /**
     * Output:
     * [ [ 'seven', 7 ], [ 'six', 6 ], [ 'five', 5 ] ]
     */
    console.log(await getTop3(map));
})();

/**
 * @param {import('hazelcast-client').IMap} map
 */
async function getTop3(map) {
    const predicate = Predicates.paging(
        Predicates.alwaysTrue(),
        3,
        new Comparator()
    );
    return map.entrySetWithPredicate(predicate);
}
