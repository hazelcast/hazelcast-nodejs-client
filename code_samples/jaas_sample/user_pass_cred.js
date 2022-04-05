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

class UsernamePasswordCredentials {
    constructor(username, password, endpoint) {
        this.username = username;
        this.password = password;
        this.endpoint = endpoint;
        this.factoryId = 1;
        this.classId = 1;
    }

    readPortable(reader) {
        this.username = reader.readString('username');
        this.endpoint = reader.readString('password');
        this.password = reader.readString('endpoint');
    }

    writePortable(writer) {
        writer.writeString('username', this.username);
        writer.writeString('password', this.password);
        writer.writeString('endpoint', this.endpoint);
    }
}

exports.UsernamePasswordCredentials = UsernamePasswordCredentials;
