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

const { Client } = require('hazelcast-client');

class IdentifiedEntryProcessor {
    constructor(value) {
        // Constructor function
    }

    readData(input) {
    }

    writeData(output) {
    }

    getFactoryId() {
        return 1;
    }

    getClassId() {
        return 9;
    }
}

class EntryProcessorDataSerializableFactory {
    create(type) {
        if (type === 1) {
            return new IdentifiedEntryProcessor();
        }
        return null;
    }
}

(async () => {
    try {
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient({
            serialization: {
                dataSerializableFactories: {
                    1: new EntryProcessorDataSerializableFactory()
                }
            }
        });
        // Get the Distributed Map from Cluster
        const map = hz.getMap('my-distributed-map');
        // Put the double value of 0 into the Distributed Map
        await map.put('key', 0);
        // Run the IdentifiedEntryProcessor class on the Cluster Member
        // holding the key called 'key'
        await map.executeOnKey('key', new IdentifiedEntryProcessor());
        // Show that the IdentifiedEntryProcessor updated the value
        const value = await map.get('key');
        console.log(value);
        // Shutdown this Hazelcast client
        hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
