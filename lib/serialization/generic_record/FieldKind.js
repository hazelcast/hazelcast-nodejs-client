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
exports.FieldKind = void 0;
/**
 * FieldKind for Compact.
 * It is designed to be used with {@link GenericRecord.getFieldKind} API.
 *
 * Note that actual ids in {@link FieldType} and {@link FieldKind} are not matching.
 * {@link FieldType} is the old API for Portable only and only meant to be used with
 * {@link PortableReader.getFieldType} API.
 *
 */
var FieldKind;
(function (FieldKind) {
    /**
     * Represents fields that do not exist.
     */
    FieldKind[FieldKind["NOT_AVAILABLE"] = 0] = "NOT_AVAILABLE";
    FieldKind[FieldKind["BOOLEAN"] = 1] = "BOOLEAN";
    FieldKind[FieldKind["ARRAY_OF_BOOLEAN"] = 2] = "ARRAY_OF_BOOLEAN";
    FieldKind[FieldKind["INT8"] = 3] = "INT8";
    FieldKind[FieldKind["ARRAY_OF_INT8"] = 4] = "ARRAY_OF_INT8";
    // char and array of char are not here because portable generic records is not supported yet
    // CHAR = 5,
    // ARRAY_OF_CHAR = 6,
    FieldKind[FieldKind["INT16"] = 7] = "INT16";
    FieldKind[FieldKind["ARRAY_OF_INT16"] = 8] = "ARRAY_OF_INT16";
    FieldKind[FieldKind["INT32"] = 9] = "INT32";
    FieldKind[FieldKind["ARRAY_OF_INT32"] = 10] = "ARRAY_OF_INT32";
    FieldKind[FieldKind["INT64"] = 11] = "INT64";
    FieldKind[FieldKind["ARRAY_OF_INT64"] = 12] = "ARRAY_OF_INT64";
    FieldKind[FieldKind["FLOAT32"] = 13] = "FLOAT32";
    FieldKind[FieldKind["ARRAY_OF_FLOAT32"] = 14] = "ARRAY_OF_FLOAT32";
    FieldKind[FieldKind["FLOAT64"] = 15] = "FLOAT64";
    FieldKind[FieldKind["ARRAY_OF_FLOAT64"] = 16] = "ARRAY_OF_FLOAT64";
    FieldKind[FieldKind["STRING"] = 17] = "STRING";
    FieldKind[FieldKind["ARRAY_OF_STRING"] = 18] = "ARRAY_OF_STRING";
    FieldKind[FieldKind["DECIMAL"] = 19] = "DECIMAL";
    FieldKind[FieldKind["ARRAY_OF_DECIMAL"] = 20] = "ARRAY_OF_DECIMAL";
    FieldKind[FieldKind["TIME"] = 21] = "TIME";
    FieldKind[FieldKind["ARRAY_OF_TIME"] = 22] = "ARRAY_OF_TIME";
    FieldKind[FieldKind["DATE"] = 23] = "DATE";
    FieldKind[FieldKind["ARRAY_OF_DATE"] = 24] = "ARRAY_OF_DATE";
    FieldKind[FieldKind["TIMESTAMP"] = 25] = "TIMESTAMP";
    FieldKind[FieldKind["ARRAY_OF_TIMESTAMP"] = 26] = "ARRAY_OF_TIMESTAMP";
    FieldKind[FieldKind["TIMESTAMP_WITH_TIMEZONE"] = 27] = "TIMESTAMP_WITH_TIMEZONE";
    FieldKind[FieldKind["ARRAY_OF_TIMESTAMP_WITH_TIMEZONE"] = 28] = "ARRAY_OF_TIMESTAMP_WITH_TIMEZONE";
    FieldKind[FieldKind["COMPACT"] = 29] = "COMPACT";
    FieldKind[FieldKind["ARRAY_OF_COMPACT"] = 30] = "ARRAY_OF_COMPACT";
    // portable and array of portable are not here because portable generic records is not supported yet
    // PORTABLE = 31,
    // ARRAY_OF_PORTABLE = 32,
    FieldKind[FieldKind["NULLABLE_BOOLEAN"] = 33] = "NULLABLE_BOOLEAN";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_BOOLEAN"] = 34] = "ARRAY_OF_NULLABLE_BOOLEAN";
    FieldKind[FieldKind["NULLABLE_INT8"] = 35] = "NULLABLE_INT8";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_INT8"] = 36] = "ARRAY_OF_NULLABLE_INT8";
    FieldKind[FieldKind["NULLABLE_INT16"] = 37] = "NULLABLE_INT16";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_INT16"] = 38] = "ARRAY_OF_NULLABLE_INT16";
    FieldKind[FieldKind["NULLABLE_INT32"] = 39] = "NULLABLE_INT32";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_INT32"] = 40] = "ARRAY_OF_NULLABLE_INT32";
    FieldKind[FieldKind["NULLABLE_INT64"] = 41] = "NULLABLE_INT64";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_INT64"] = 42] = "ARRAY_OF_NULLABLE_INT64";
    FieldKind[FieldKind["NULLABLE_FLOAT32"] = 43] = "NULLABLE_FLOAT32";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_FLOAT32"] = 44] = "ARRAY_OF_NULLABLE_FLOAT32";
    FieldKind[FieldKind["NULLABLE_FLOAT64"] = 45] = "NULLABLE_FLOAT64";
    FieldKind[FieldKind["ARRAY_OF_NULLABLE_FLOAT64"] = 46] = "ARRAY_OF_NULLABLE_FLOAT64";
})(FieldKind = exports.FieldKind || (exports.FieldKind = {}));
//# sourceMappingURL=FieldKind.js.map