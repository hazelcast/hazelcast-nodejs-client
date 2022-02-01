/* eslint-disable */
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

const { RabinFingerPrintLongByte, RabinFingerPrintLongInt, INIT } = require('../../../../lib/serialization/compact/RabinFingerprint');
const chai = require('chai');
const Long = require('long');
const { RabinFingerPrintLongString } = require('../../../../src/serialization/compact/RabinFingerprint');
const { SchemaWriter } = require('../../../../lib/serialization/compact/SchemaWriter');
const { LocalDateTime } = require('../../../../lib');
chai.should();

describe('RabinFingerprintTest', function () {
    [
        ['100', -5, '-6165936963810616235'],
        ['-9223372036854775808', 0, '36028797018963968'],
        ['9223372036854775807', 113, '-3588673659009074035'],
        ['-13', -13, '72057594037927935'],
        ['42', 42, '0'],
        ['42', -42, '-1212835703325587522'],
        ['0', 0, '0'],
        ['-123456789', 0, '7049212178818848951'],
        ['123456789', 127, '-8322440716502314713'],
        ['127', -128, '-7333697815154264656']
    ].forEach((params) => {
        it(`i8 test ${params}`, function () {
            RabinFingerPrintLongByte(Long.fromString(params[0]), params[1]).eq(Long.fromString(params[2])).should.be.true;
        });
    });

    [
        ['-9223372036854775808', 2147483647, '6066553457199370002'],
        ['9223372036854775807', -2147483648, '6066553459773452525'],
        ['9223372036854707', 42, '-961937498224213201'],
        ['-42', -42, '4294967295'],
        ['42', 42, '0'],
        ['42', -442, '7797744281030715531'],
        ['0', 0, '0'],
        ['-123456789', 0, '-565582369564281851'],
        ['123456786669', 42127, '7157681543413310373'],
        ['2147483647', -2147483648, '-7679311364898232185'],
    ].forEach(params => {
        it(`i32 test ${params}`, function () {
            RabinFingerPrintLongInt(Long.fromString(params[0]), params[1]).eq(Long.fromString(params[2])).should.be.true;
        });
    });


    [
        ['0', "hazelcast", '8164249978089638648'],
        ['-31231241235', "üğişçö", '6128923854942458838'],
        ['41231542121235', "😀 😃 😄", '-6875080751809013377'],
        [INIT, "STUdent", '1896492170246289820'],
        [INIT, "aü😄", '-2084249746924383631'],
        [INIT, "", '-2316162475121075004'],
        ['-123321', "xyz", '2601391163390439688'],
        ['132132123132132', "    ç", '-7699875372487088773'],
        ['42', "42", '7764866287864698590'],
        ['-42', "-42", '-3434092993477103253'],
    ].forEach(params => {
        it(`string test ${params}`, function () {
            if (params[0] === INIT) {
                RabinFingerPrintLongString(params[0], params[1]).eq(Long.fromString(params[2])).should.be.true;
            } else {
                RabinFingerPrintLongString(Long.fromString(params[0]), params[1]).eq(Long.fromString(params[2])).should.be.true;
            }
        });
    });

    it('should compute correct fingerprint with schema writer', function () {
        const writer = new SchemaWriter('SomeType');
        writer.writeInt32('id', 0);
        writer.writeString('name', '');
        writer.writeInt8('age', 0);
        writer.writeArrayOfTimestamp('times', []);
        const schema = writer.build();
        schema.schemaId.eq(Long.fromString('-5445839760245891300')).should.be.true;
    });

});
