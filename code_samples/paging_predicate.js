/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const {
    Client,
    Predicates
} = require('hazelcast-client');

// This comparator is both a comparator and an IdentifiedDataSerializable.
// Note that a comparator should be a serializable object (IdentifiedDataSerializable
// or Portable) because Hazelcast members should be able to deserialize the
// comparator in order to sort entries. So the same class should be registered
// to Hazelcast server instance.
const comparator = {
    getFactoryId: () => 1,
    getClassId: () => 10,
    // This comparator sorts entries according to their keys
    // in reverse alphabetical order.
    sort: (a, b) => {
        if (a[0] > b[0]) return -1;
        if (a[0] < b[0]) return 1;
        return 0;
    },
    readData: () => {},
    writeData: () => {}
};

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                // We register our comparator object as IdentifiedDataSerializable
                dataSerializableFactories: {
                    1: {
                        create: () => comparator
                    }
                }
            }
        });

        const map = await client.getMap('test');
        await map.putAll([
            ['a', 1], ['b', 2], ['c', 3], ['d', 4],
            ['e', 5], ['f', 6],['g', 7]
        ]);
        const mapSize = await map.size();
        console.log(`Added ${mapSize} elements`);

        const predicate = Predicates.paging(Predicates.alwaysTrue(), 2, comparator);

        predicate.setPage(0);
        let values = await map.valuesWithPredicate(predicate);
        console.log('Page 0:', values);

        predicate.setPage(1);
        values = await map.valuesWithPredicate(predicate);
        console.log('Page 1:', values);

        predicate.setPage(2);
        values = await map.valuesWithPredicate(predicate);
        console.log('Page 2:', values);

        predicate.setPage(3);
        values = await map.valuesWithPredicate(predicate);
        console.log('Page 3:', values);

        client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
