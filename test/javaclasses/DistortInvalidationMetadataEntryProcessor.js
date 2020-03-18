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

function DistortInvalidationMetadataEntryProcessor(mapName, mapSize, duration) {
    this.mapSize = mapSize;
    this.mapName = mapName;
    this.duration = duration;
}

DistortInvalidationMetadataEntryProcessor.prototype.readData = function (inp) {
    this.mapName = inp.readUTF();
    this.mapSize = inp.readInt();
    this.duration = inp.readInt();
};

DistortInvalidationMetadataEntryProcessor.prototype.writeData = function (outp) {
    outp.writeUTF(this.mapName);
    outp.writeInt(this.mapSize);
    outp.writeInt(this.duration);
};

DistortInvalidationMetadataEntryProcessor.prototype.getFactoryId = function () {
    return 66;
};

DistortInvalidationMetadataEntryProcessor.prototype.getClassId = function () {
    return 3;
};

module.exports = DistortInvalidationMetadataEntryProcessor;
