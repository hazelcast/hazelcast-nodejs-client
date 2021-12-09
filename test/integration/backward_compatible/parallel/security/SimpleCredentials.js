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

class SimpleCredentials {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.type = 'CUSTOM';
        this.factoryId = 1;
        this.classId = 1;
    }

    readData(input) {
        this.username = input.readString();
        this.password = input.readString();
    }

    writeData(output) {
        output.writeString(this.username);
        output.writeString(this.password);
    }
}

exports.SimpleCredentials = SimpleCredentials;
