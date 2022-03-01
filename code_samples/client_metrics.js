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

const { Client } = require('hazelcast-client');

(async () => {
    const client = await Client.newHazelcastClient({
            nearCaches: {
                // Enable near cache with all defaults
                'nearCachedMap': {}
            },
            metrics: {
                enabled: true,
                collectionFrequencySeconds: 2
            }
    });
    const ncMap = await client.getMap('nearCachedMap');

    // Warm up the near cache
    await ncMap.put('key1', 'value1');
    await ncMap.get('key1');
    await ncMap.get('key1');
    await ncMap.get('key1');

    // At this point, we have 1 near cache miss, 2 near cache hits
    // in client's near cache statistics. Sleep more than statistics
    // collection time and keep client running. Then, you should see
    // the statistics in Hazelcast Management Center 4.0
    await new Promise((resolve) => setTimeout(resolve, 60000));
    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
