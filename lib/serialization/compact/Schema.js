"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
const FieldOperations_1 = require("../generic_record/FieldOperations");
const FieldKind_1 = require("../generic_record/FieldKind");
const BitsUtil_1 = require("../../util/BitsUtil");
const RabinFingerprint_1 = require("./RabinFingerprint");
/**
 * @internal
 */
class Schema {
    constructor(typeName, fields) {
        this.typeName = typeName;
        this.fields = fields;
        this.fieldDefinitionMap = new Map();
        for (const field of fields) {
            this.fieldDefinitionMap.set(field.fieldName, field);
        }
        this.init();
    }
    init() {
        const fixedSizeFields = [];
        const booleanFields = [];
        const variableSizeFields = [];
        for (const descriptor of this.fieldDefinitionMap.values()) {
            const fieldKind = descriptor.kind;
            if (FieldOperations_1.FieldOperations.fieldOperations(fieldKind).kindSizeInBytes() === FieldOperations_1.FieldOperations.VARIABLE_SIZE) {
                variableSizeFields.push(descriptor);
            }
            else {
                if (fieldKind === FieldKind_1.FieldKind.BOOLEAN) {
                    booleanFields.push(descriptor);
                }
                else {
                    fixedSizeFields.push(descriptor);
                }
            }
        }
        fixedSizeFields.sort((a, b) => FieldOperations_1.FieldOperations.fieldOperations(b.kind).kindSizeInBytes()
            - FieldOperations_1.FieldOperations.fieldOperations(a.kind).kindSizeInBytes());
        let offset = 0;
        for (const descriptor of fixedSizeFields) {
            descriptor.offset = offset;
            offset += FieldOperations_1.FieldOperations.fieldOperations(descriptor.kind).kindSizeInBytes();
        }
        let bitOffset = 0;
        for (const descriptor of booleanFields) {
            descriptor.offset = offset;
            descriptor.bitOffset = bitOffset % BitsUtil_1.BitsUtil.BITS_IN_A_BYTE;
            bitOffset++;
            if (bitOffset % BitsUtil_1.BitsUtil.BITS_IN_A_BYTE === 0) {
                offset += 1;
            }
        }
        if (bitOffset % BitsUtil_1.BitsUtil.BITS_IN_A_BYTE !== 0) {
            offset += 1;
        }
        this.fixedSizeFieldsLength = offset;
        let index = 0;
        for (const descriptor of variableSizeFields) {
            descriptor.index = index;
            index++;
        }
        this.numberVarSizeFields = index;
        this.schemaId = RabinFingerprint_1.RabinFingerprint64.ofSchema(this);
    }
    getFields() {
        return this.fieldDefinitionMap.values();
    }
    hasSameFields(other) {
        if (other.fieldDefinitionMap.size !== this.fieldDefinitionMap.size) {
            return false;
        }
        for (const [fieldName, field] of this.fieldDefinitionMap) {
            if (!other.fieldDefinitionMap.has(fieldName)) {
                return false;
            }
            const otherField = other.fieldDefinitionMap.get(fieldName);
            if (!otherField.equals(field)) {
                return false;
            }
        }
        return true;
    }
    equals(other) {
        if (this === other) {
            return true;
        }
        return this.numberVarSizeFields === other.numberVarSizeFields &&
            this.fixedSizeFieldsLength === other.fixedSizeFieldsLength &&
            this.typeName === other.typeName &&
            this.schemaId.equals(other.schemaId) &&
            this.hasSameFields(other);
    }
}
exports.Schema = Schema;
//# sourceMappingURL=Schema.js.map