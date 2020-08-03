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

class CustomSerializable {
    constructor(value) {
        this.value = value;
        this.hzCustomId = 10;
    }
}

class CustomSerializer {
    constructor() {
        this.id = 10;
    }

    read(input) {
        const len = input.readInt();
        let str = '';
        for (let i = 0; i < len; i++) {
            str = str + String.fromCharCode(input.readInt());
        }
        return new CustomSerializable(str);
    }

    write(output, obj) {
        output.writeInt(obj.value.length);
        for (let i = 0; i < obj.value.length; i++) {
            output.writeInt(obj.value.charCodeAt(i));
        }
    }
}

(async () => {
    try {
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient({
            serialization: {
                customSerializers: [new CustomSerializer()]
            }
        });
        // CustomSerializer will serialize/deserialize CustomSerializable objects

        // Shutdown this Hazelcast client
        hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
