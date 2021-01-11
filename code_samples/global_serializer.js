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

/**
 * JSON serialization is not capable if handling circular references.
 * We will use Mousse serializer to serialize our self referring objects.
 */
const mousse = require('mousse');
const { Client } = require('hazelcast-client');

const selfReferringObject = {
    value: 10
};
selfReferringObject.self = selfReferringObject;

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                globalSerializer: {
                    mousseSerialize: mousse.serialize,
                    mousseDeserialize: mousse.deserialize,
                    id: 10,
                    write: function (output, obj) {
                        output.writeUTF(this.mousseSerialize(obj))
                    },
                    read: function (input) {
                        const representation = input.readUTF();
                        return this.mousseDeserialize(representation).then(function (obj) {
                            return obj;
                        });
                    }
                }
            }
        });

        const map = await client.getMap('objects');
        await map.put(1, selfReferringObject);

        const obj = await map.get(1);
        console.log(obj);
        console.log(obj.self);
        console.log(obj.self.self);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
