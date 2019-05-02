/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

function UsernamePasswordCredentials(username, password, endpoint) {
    this.username = username;
    this.password = password;
    this.endpoint = endpoint;
}

UsernamePasswordCredentials.prototype.readPortable = function (reader) {
    this.username = reader.readUTF('username');
    this.endpoint = reader.readUTF('password');
    this.password = reader.readUTF('endpoint');
};

UsernamePasswordCredentials.prototype.writePortable = function (writer) {
    writer.writeUTF('username', this.username);
    writer.writeUTF('password', this.password);
    writer.writeUTF('endpoint', this.endpoint);
};

UsernamePasswordCredentials.prototype.getFactoryId = function () {
    return 1;
};

UsernamePasswordCredentials.prototype.getClassId = function () {
    return 1;
};

exports.UsernamePasswordCredentials = UsernamePasswordCredentials;
