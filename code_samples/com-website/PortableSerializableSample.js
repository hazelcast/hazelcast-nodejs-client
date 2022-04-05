/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const Long = require('long');

class Customer {
    constructor(name, id, lastOrder) {
        this.name = name;
        this.id = id;
        this.lastOrder = lastOrder;
        this.factoryId = 1;
        this.classId = 1;
    }

    readPortable(reader) {
        this.name = reader.readString('name');
        this.id = reader.readInt('id');
        this.lastOrder = reader.readLong('lastOrder').toNumber();
    }

    writePortable(writer) {
        writer.writeString('name', this.name);
        writer.writeInt('id', this.id);
        writer.writeLong('lastOrder', Long.fromNumber(this.lastOrder));
    }
}

function portableFactory(classId) {
    if (classId === 1) {
        return new Customer();
    }
    return null;
}

(async () => {
    // Start the Hazelcast Client and connect to an already running
    // Hazelcast Cluster on 127.0.0.1
    const hz = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    1: portableFactory
                }
            }
    });
        // Customer can be used here

    // Shutdown this Hazelcast client
    await hz.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
