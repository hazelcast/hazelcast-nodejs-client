/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

/**
 *
 * @param type
 *          0 -> lexicographical order
 *          1 -> reverse lexicographical
 *          2 -> length increasing order
 * @constructor
 */
function CustomComparator(type, iterationType) {
    this.type = type;
    this.iterationType = iterationType;
}

CustomComparator.prototype.getFactoryId = function () {
    return 66;
};

CustomComparator.prototype.getClassId = function () {
    return 2;
};

CustomComparator.prototype.writeData = function (outp) {
    outp.writeInt(this.type);
    outp.writeInt(this.iterationType);
};

CustomComparator.prototype.readData = function (inp) {
    this.type = inp.readInt();
    this.iterationType = inp.readInt();
};

CustomComparator.prototype.sort = function (o1, o2) {
    if (this.type === 0) {
        return o1[1] - o2[1];
    } else {
        return o2[1] - o1[1];
    }
};

module.exports = CustomComparator;
