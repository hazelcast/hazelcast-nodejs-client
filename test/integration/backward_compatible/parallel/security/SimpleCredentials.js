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
const TestUtil = require('../../../../TestUtil');

class SimpleCredentials {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.factoryId = 1;
        this.classId = 1;
    }

    readData(input) {
        // readString is added in 4.2 https://github.com/hazelcast/hazelcast-nodejs-client/pull/802
        if (TestUtil.isClientVersionAtLeast('4.2')) {
            this.username = input.readString();
            this.password = input.readString();
        } else {
            this.username = input.readUTF();
            this.password = input.readUTF();
        }
    }

    writeData(output) {
        // writeString is added in 4.2 https://github.com/hazelcast/hazelcast-nodejs-client/pull/802
        if (TestUtil.isClientVersionAtLeast('4.2')) {
            output.writeString(this.username);
            output.writeString(this.password);
        } else {
            output.writeUTF(this.username);
            output.writeUTF(this.password);
        }
    }
}

exports.SimpleCredentials = SimpleCredentials;
