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

const TestUtil = require('../../../TestUtil');

function Address(street, zipCode, city, state) {
    this.street = street;
    this.zipCode = zipCode;
    this.city = city;
    this.state = state;
    this.factoryId = 1;
    this.classId = 1;
}

Address.prototype.writeData = function (objectDataOutput) {
    TestUtil.writeStringToOutput(objectDataOutput, this.street);
    objectDataOutput.writeInt(this.zipCode);
    TestUtil.writeStringToOutput(objectDataOutput, this.city);
    TestUtil.writeStringToOutput(objectDataOutput, this.state);
};

Address.prototype.readData = function (objectDataInput) {
    this.street = TestUtil.readStringFromInput(objectDataInput);
    this.zipCode = objectDataInput.readInt();
    this.city = TestUtil.readStringFromInput(objectDataInput);
    this.state = TestUtil.readStringFromInput(objectDataInput);
};

function myIdentifiedFactory(classId) {
    if (classId === 1) {
        return new Address();
    }
}

exports.myIdentifiedFactory = myIdentifiedFactory;
exports.Address = Address;
