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

function Musician(name) {
    this.name = name;
    this.hzCustomId = 10;
}

function MusicianSerializer() {
}

MusicianSerializer.prototype.id = 10;

MusicianSerializer.prototype.write = function (objectDataOutput, object) {
    objectDataOutput.writeInt(object.name.length);
    for (let i = 0; i < object.name.length; i++) {
        objectDataOutput.writeInt(object.name.charCodeAt(i));
    }
};

MusicianSerializer.prototype.read = function (objectDataInput) {
    const len = objectDataInput.readInt();
    let name = '';
    for (let i = 0; i < len; i++) {
        name = name + String.fromCharCode(objectDataInput.readInt());
    }
    return new Musician(name);
};

exports.MusicianSerializer = MusicianSerializer;
exports.Musician = Musician;
