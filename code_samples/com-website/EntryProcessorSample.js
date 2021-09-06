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

class IdentifiedEntryProcessor {
    constructor() {
        this.factoryId = 1;
        this.classId = 9;
    }

    readData() {
        // no-op
    }

    writeData() {
        // no-op
    }
}

function entryProcessorDataSerializableFactory(classId) {
    if (classId === 1) {
        return new IdentifiedEntryProcessor();
    }
    return null;
}

(async () => {
    try {
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient({
            serialization: {
                dataSerializableFactories: {
                    1: entryProcessorDataSerializableFactory
                }
            }
        });
        // Get the Distributed Map from Cluster
        const map = await hz.getMap('my-distributed-map');
        // Put the double value of 0 into the Distributed Map
        await map.put('key', 0);
        // Run the IdentifiedEntryProcessor class on the Cluster Member
        // holding the key called 'key'
        await map.executeOnKey('key', new IdentifiedEntryProcessor());
        // Show that the IdentifiedEntryProcessor updated the value
        const value = await map.get('key');
        console.log(value);
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
