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

var IterationType = require('../../lib/').IterationType;

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

CustomComparator.prototype.sort = function (e1, e2) {
    var str1;
    var str2;
    switch (this.iterationType) {
        case IterationType.KEY:
            str1 = e1[0].toString();
            str2 = e2[0].toString();
            break;
        case IterationType.VALUE:
            str1 = e1[1].toString();
            str2 = e2[1].toString();
            break;
        case IterationType.ENTRY:
            str1 = e1[0].toString() + e1[1].toString();
            str2 = e2[0].toString() + e2[1].toString();
            break;
        default:
            str1 = e1[0].toString();
            str2 = e2[0].toString();
    }
    switch (this.type) {
        case 0:
            return str1.localeCompare(str2);
        case 1:
            return str2.localeCompare(str1);
        case 2:
            return str1.length - str2.length;
    }
    return 0;
};

module.exports = CustomComparator;
