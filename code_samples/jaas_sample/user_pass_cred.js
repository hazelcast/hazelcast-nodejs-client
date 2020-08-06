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

class UsernamePasswordCredentials {
    constructor(username, password, endpoint) {
        this.username = username;
        this.password = password;
        this.endpoint = endpoint;
    }

    readPortable(input) {
        this.username = input.readUTF('username');
        this.endpoint = input.readUTF('password');
        this.password = input.readUTF('endpoint');
    }

    writePortable(output) {
        output.writeUTF('username', this.username);
        output.writeUTF('password', this.password);
        output.writeUTF('endpoint', this.endpoint);
    }

    getFactoryId() {
        return 1;
    }

    getClassId() {
        return 1;
    }
}

exports.UsernamePasswordCredentials = UsernamePasswordCredentials;
