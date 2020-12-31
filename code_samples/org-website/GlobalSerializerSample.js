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

class GlobalSerializer {
    constructor() {
        this.id = 20;
    }

    read(input) { // eslint-disable-line no-unused-vars
        // return MyFavoriteSerializer.deserialize(input.readByteArray());
    }

    write(output, obj) { // eslint-disable-line no-unused-vars
        // output.writeByteArray(MyFavoriteSerializer.serialize(obj));
    }
}

(async () => {
    try {
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient({
            serialization: {
                globalSerializer: new GlobalSerializer()
            }
        });
        // GlobalSerializer will serialize/deserialize all non-builtin types

        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
