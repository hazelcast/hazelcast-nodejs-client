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
exports.FieldValidator = void 0;
const FieldOperations_1 = require("./FieldOperations");
/**
 * Used for generic record field validation.
 * @internal
 */
class FieldValidator {
    static validateField(fieldName, fieldKind, value, checkingArrayElement = false) {
        const getErrorStringFn = checkingArrayElement ?
            FieldValidator.getErrorStringForElement :
            FieldValidator.getErrorStringForField;
        FieldOperations_1.FieldOperations.fieldOperations(fieldKind).validateField(fieldName, value, getErrorStringFn);
    }
    static getErrorStringForElement(fieldName, typeName, value) {
        return 'Generic record field validation error: ' +
            `Expected a ${typeName} element in field ${fieldName}, but got: ${value}`;
    }
    static getErrorStringForField(fieldName, typeName, value) {
        return 'Generic record field validation error: ' +
            `Expected a ${typeName} for field ${fieldName}, but got: ${value}`;
    }
    static throwTypeErrorWithMessage(fieldName, typeName, value, getErrorStringFn) {
        throw new TypeError(getErrorStringFn(fieldName, typeName, value));
    }
    static validateType(fieldName, jsType, value, getErrorStringFn) {
        if (typeof value !== jsType) {
            FieldValidator.throwTypeErrorWithMessage(fieldName, jsType, value, getErrorStringFn);
        }
    }
    static checkArrayOrNull(fieldName, value) {
        if (!Array.isArray(value) && value !== null) {
            throw new TypeError(`Expected an array or null for field ${fieldName}, but got: ${value}`);
        }
    }
    static validateArray(fieldName, value, elementKind) {
        FieldValidator.checkArrayOrNull(fieldName, value);
        if (value !== null) {
            for (const element of value) {
                FieldValidator.validateField(fieldName, elementKind, element, true);
            }
        }
    }
    static validateNullableType(fieldName, jsType, value, getErrorStringFn) {
        if (typeof value !== jsType && value !== null) {
            FieldValidator.throwTypeErrorWithMessage(fieldName, jsType, value, getErrorStringFn);
        }
    }
    static validateNumberRange(fieldName, value, min, max) {
        if (value < min || value > max) {
            throw new RangeError('Generic record field validation error: ' +
                `Expected a number in range [${min}, ${max}] for field ${fieldName}, but got: ${value}`);
        }
    }
    static validateInt8Range(fieldName, value) {
        return FieldValidator.validateNumberRange(fieldName, value, -128, 127);
    }
    static validateInt16Range(fieldName, value) {
        return FieldValidator.validateNumberRange(fieldName, value, -32768, 32767);
    }
    static validateInt32Range(fieldName, value) {
        return FieldValidator.validateNumberRange(fieldName, value, -2147483648, 2147483647);
    }
}
exports.FieldValidator = FieldValidator;
//# sourceMappingURL=FieldValidator.js.map