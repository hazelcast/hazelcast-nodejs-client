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

function Address(street, zipCode, city, state) {
    this.street = street;
    this.zipCode = zipCode;
    this.city = city;
    this.state = state;
}

Address.prototype.getClassId = function () {
    return 1;
};

Address.prototype.getFactoryId = function () {
    return 1;
};

Address.prototype.writeData = function (objectDataOutput) {
    objectDataOutput.writeUTF(this.street);
    objectDataOutput.writeInt(this.zipCode);
    objectDataOutput.writeUTF(this.city);
    objectDataOutput.writeUTF(this.state);
};

Address.prototype.readData = function (objectDataInput) {
    this.street = objectDataInput.readUTF();
    this.zipCode = objectDataInput.readInt();
    this.city = objectDataInput.readUTF();
    this.state = objectDataInput.readUTF();
};

function MyIdentifiedFactory() {

}

MyIdentifiedFactory.prototype.create = function (type) {
    if (type === 1) {
        return new Address();
    }
}

exports.MyIdentifiedFactory = MyIdentifiedFactory;
exports.Address = Address;
