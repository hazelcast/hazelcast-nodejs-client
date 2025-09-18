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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldType = void 0;
/**
 * Portable field type.
 */
var FieldType;
(function (FieldType) {
    FieldType[FieldType["PORTABLE"] = 0] = "PORTABLE";
    FieldType[FieldType["BYTE"] = 1] = "BYTE";
    FieldType[FieldType["BOOLEAN"] = 2] = "BOOLEAN";
    FieldType[FieldType["CHAR"] = 3] = "CHAR";
    FieldType[FieldType["SHORT"] = 4] = "SHORT";
    FieldType[FieldType["INT"] = 5] = "INT";
    FieldType[FieldType["LONG"] = 6] = "LONG";
    FieldType[FieldType["FLOAT"] = 7] = "FLOAT";
    FieldType[FieldType["DOUBLE"] = 8] = "DOUBLE";
    FieldType[FieldType["UTF"] = 9] = "UTF";
    FieldType[FieldType["STRING"] = 9] = "STRING";
    FieldType[FieldType["PORTABLE_ARRAY"] = 10] = "PORTABLE_ARRAY";
    FieldType[FieldType["BYTE_ARRAY"] = 11] = "BYTE_ARRAY";
    FieldType[FieldType["BOOLEAN_ARRAY"] = 12] = "BOOLEAN_ARRAY";
    FieldType[FieldType["CHAR_ARRAY"] = 13] = "CHAR_ARRAY";
    FieldType[FieldType["SHORT_ARRAY"] = 14] = "SHORT_ARRAY";
    FieldType[FieldType["INT_ARRAY"] = 15] = "INT_ARRAY";
    FieldType[FieldType["LONG_ARRAY"] = 16] = "LONG_ARRAY";
    FieldType[FieldType["FLOAT_ARRAY"] = 17] = "FLOAT_ARRAY";
    FieldType[FieldType["DOUBLE_ARRAY"] = 18] = "DOUBLE_ARRAY";
    FieldType[FieldType["UTF_ARRAY"] = 19] = "UTF_ARRAY";
    FieldType[FieldType["STRING_ARRAY"] = 19] = "STRING_ARRAY";
    FieldType[FieldType["DECIMAL"] = 20] = "DECIMAL";
    FieldType[FieldType["DECIMAL_ARRAY"] = 21] = "DECIMAL_ARRAY";
    FieldType[FieldType["TIME"] = 22] = "TIME";
    FieldType[FieldType["TIME_ARRAY"] = 23] = "TIME_ARRAY";
    FieldType[FieldType["DATE"] = 24] = "DATE";
    FieldType[FieldType["DATE_ARRAY"] = 25] = "DATE_ARRAY";
    FieldType[FieldType["TIMESTAMP"] = 26] = "TIMESTAMP";
    FieldType[FieldType["TIMESTAMP_ARRAY"] = 27] = "TIMESTAMP_ARRAY";
    FieldType[FieldType["TIMESTAMP_WITH_TIMEZONE"] = 28] = "TIMESTAMP_WITH_TIMEZONE";
    FieldType[FieldType["TIMESTAMP_WITH_TIMEZONE_ARRAY"] = 29] = "TIMESTAMP_WITH_TIMEZONE_ARRAY";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
//# sourceMappingURL=Portable.js.map