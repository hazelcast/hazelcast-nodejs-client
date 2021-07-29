/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
    Aggregators,
    Predicates
} = require('hazelcast-client');

(async () => {
    try {
        const client = await Client.newHazelcastClient();
        const map = await client.getMap('person-age-map' + Math.random().toString());

        await map.putAll([
            ['Philip', 46],
            ['Elizabeth', 44],
            ['Henry', 13],
            ['Paige', 15]
        ]);

        let count = await map.aggregate(Aggregators.count());
        console.log(`There are ${count} people.`);
        count = await map.aggregateWithPredicate(Aggregators.count(), Predicates.lessEqual('this', 18));
        console.log(`There are ${count} children.`);
        const avgAge = await map.aggregate(Aggregators.numberAvg());
        console.log(`Average age is ${avgAge}`);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
