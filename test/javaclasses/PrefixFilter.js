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

function PrefixFilter(prefix) {
    this.prefix = prefix;
}

PrefixFilter.prototype.readData = function (inp) {
    this.prefix = inp.readUTF();
};

PrefixFilter.prototype.writeData = function (outp) {
    outp.writeUTF(this.prefix);
};

PrefixFilter.prototype.getFactoryId = function () {
    return 66;
};

PrefixFilter.prototype.getClassId = function () {
    return 4;
};

module.exports = PrefixFilter;
