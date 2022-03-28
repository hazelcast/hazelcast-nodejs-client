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

const chai = require('chai');
const { SchemaWriter } = require('../../../../lib/serialization/compact/SchemaWriter');
const { FieldDescriptor } = require('../../../../lib/serialization/generic_record/FieldDescriptor');
const { FieldKind } = require('../../../../lib');
const {
    createSerializationService,
    supportedFields
} = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { PositionalObjectDataOutput } = require('../../../../lib/serialization/ObjectData');
const { RabinFingerprint64 } = require('../../../../lib/serialization/compact/RabinFingerprint');
const TestUtil = require('../../../TestUtil');
chai.should();

describe('SchemaWriterTest', function () {
    it('should use RabinFingerprint to compute schema id', function () {
        const writer = new SchemaWriter('typeName');
        writer.addField(new FieldDescriptor('a', FieldKind.BOOLEAN));
        writer.addField(new FieldDescriptor('b', FieldKind.ARRAY_OF_BOOLEAN));
        writer.addField(new FieldDescriptor('c', FieldKind.TIMESTAMP_WITH_TIMEZONE));
        const schema = writer.build();

        const {serializationService} = createSerializationService();

        const out = new PositionalObjectDataOutput(serializationService, false);
        schema.writeData(out);

        const fingerprint64 = RabinFingerprint64.ofBuffer(out.toBuffer());
        fingerprint64.eq(schema.schemaId).should.be.true;
    });

    it('should store and retrieve field descriptors correctly', function () {
        const writer = new SchemaWriter('typeName');

        const fields = [];

        for (const fieldKind of supportedFields) {
            const name = TestUtil.randomString(5);
            fields.push({fieldKind, name});
            switch (fieldKind) {
                case FieldKind.BOOLEAN:
                    writer.writeBoolean(name, null);
                    break;
                case FieldKind.ARRAY_OF_BOOLEAN:
                    writer.writeArrayOfBoolean(name, null);
                    break;
                case FieldKind.INT8:
                    writer.writeInt8(name, null);
                    break;
                case FieldKind.ARRAY_OF_INT8:
                    writer.writeArrayOfInt8(name, null);
                    break;
                case FieldKind.INT16:
                    writer.writeInt16(name, null);
                    break;
                case FieldKind.ARRAY_OF_INT16:
                    writer.writeArrayOfInt16(name, null);
                    break;
                case FieldKind.INT32:
                    writer.writeInt32(name, null);
                    break;
                case FieldKind.ARRAY_OF_INT32:
                    writer.writeArrayOfInt32(name, null);
                    break;
                case FieldKind.INT64:
                    writer.writeInt64(name, null);
                    break;
                case FieldKind.ARRAY_OF_INT64:
                    writer.writeArrayOfInt64(name, null);
                    break;
                case FieldKind.FLOAT32:
                    writer.writeFloat32(name, null);
                    break;
                case FieldKind.ARRAY_OF_FLOAT32:
                    writer.writeArrayOfFloat32(name, null);
                    break;
                case FieldKind.FLOAT64:
                    writer.writeFloat64(name, null);
                    break;
                case FieldKind.ARRAY_OF_FLOAT64:
                    writer.writeArrayOfFloat64(name, null);
                    break;
                case FieldKind.STRING:
                    writer.writeString(name, null);
                    break;
                case FieldKind.ARRAY_OF_STRING:
                    writer.writeArrayOfString(name, null);
                    break;
                case FieldKind.DECIMAL:
                    writer.writeDecimal(name, null);
                    break;
                case FieldKind.ARRAY_OF_DECIMAL:
                    writer.writeArrayOfDecimal(name, null);
                    break;
                case FieldKind.TIME:
                    writer.writeTime(name, null);
                    break;
                case FieldKind.ARRAY_OF_TIME:
                    writer.writeArrayOfTime(name, null);
                    break;
                case FieldKind.DATE:
                    writer.writeDate(name, null);
                    break;
                case FieldKind.ARRAY_OF_DATE:
                    writer.writeArrayOfDate(name, null);
                    break;
                case FieldKind.TIMESTAMP:
                    writer.writeTimestamp(name, null);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP:
                    writer.writeArrayOfTimestamp(name, null);
                    break;
                case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                    writer.writeTimestampWithTimezone(name, null);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                    writer.writeArrayOfTimestampWithTimezone(name, null);
                    break;
                case FieldKind.COMPACT:
                    writer.writeCompact(name, null);
                    break;
                case FieldKind.ARRAY_OF_COMPACT:
                    writer.writeArrayOfCompact(name, null);
                    break;
                case FieldKind.NULLABLE_BOOLEAN:
                    writer.writeNullableBoolean(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                    writer.writeArrayOfNullableBoolean(name, null);
                    break;
                case FieldKind.NULLABLE_INT8:
                    writer.writeNullableInt8(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT8:
                    writer.writeArrayOfNullableInt8(name, null);
                    break;
                case FieldKind.NULLABLE_INT16:
                    writer.writeNullableInt16(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT16:
                    writer.writeArrayOfNullableInt16(name, null);
                    break;
                case FieldKind.NULLABLE_INT32:
                    writer.writeNullableInt32(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT32:
                    writer.writeArrayOfNullableInt32(name, null);
                    break;
                case FieldKind.NULLABLE_INT64:
                    writer.writeNullableInt64(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT64:
                    writer.writeArrayOfNullableInt64(name, null);
                    break;
                case FieldKind.NULLABLE_FLOAT32:
                    writer.writeNullableFloat32(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                    writer.writeArrayOfNullableFloat32(name, null);
                    break;
                case FieldKind.NULLABLE_FLOAT64:
                    writer.writeNullableFloat64(name, null);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                    writer.writeArrayOfNullableFloat64(name, null);
                    break;
            }
        }

        const schema = writer.build();
        for (const { name, fieldKind } of fields) {
            schema.fieldDefinitionMap.get(name).kind.should.be.eq(fieldKind);
        }
    });
});
