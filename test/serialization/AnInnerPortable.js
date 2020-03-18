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

function AnInnerPortable(anInt, aFloat) {
    this.anInt = anInt;
    this.aFloat = aFloat;
}

AnInnerPortable.prototype.getFactoryId = function () {
    return 1;
};

AnInnerPortable.prototype.getClassId = function () {
    return 2;
};
AnInnerPortable.prototype.writePortable = function (writer) {
    writer.writeInt('i', this.anInt);
    writer.writeFloat('f', this.aFloat);
};
AnInnerPortable.prototype.readPortable = function (reader) {
    this.anInt = reader.readInt('i');
    this.aFloat = reader.readFloat('f');
};
AnInnerPortable.prototype.equals = function (other) {
    if (other === this)
        return true;
    if (this.anInt !== other.anInt)
        return false;
    if (this.aFloat > other.aFloat + Number.EPSILON || this.aFloat < other.aFloat - Number.EPSILON)
        return false;
    return true;
}
module.exports = AnInnerPortable;
