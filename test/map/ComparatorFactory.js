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

function noop() {
    //NO-OP
}

function ReverseValueComparator() {
    //Empty
}

ReverseValueComparator.prototype.readData = noop;

ReverseValueComparator.prototype.writeData = noop;

ReverseValueComparator.prototype.getFactoryId = function () {
    return 1;
};

ReverseValueComparator.prototype.getClassId = function () {
    return 1;
};

ReverseValueComparator.prototype.sort = function (o1, o2) {
    return o2[1] - o1[1];
};

exports.ComparatorFactory = {
    create: function (type) {
        if (type === 1) {
            return new ReverseValueComparator();
        } else {
            return null;
        }
    }
};

exports.ReverseValueComparator = ReverseValueComparator;
