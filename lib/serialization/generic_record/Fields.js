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
exports.ARRAY_OF_GENERIC_RECORD = exports.GENERIC_RECORD = exports.ARRAY_OF_NULLABLE_FLOAT64 = exports.NULLABLE_FLOAT64 = exports.ARRAY_OF_NULLABLE_FLOAT32 = exports.NULLABLE_FLOAT32 = exports.ARRAY_OF_NULLABLE_INT64 = exports.NULLABLE_INT64 = exports.ARRAY_OF_NULLABLE_INT32 = exports.NULLABLE_INT32 = exports.ARRAY_OF_NULLABLE_INT16 = exports.NULLABLE_INT16 = exports.ARRAY_OF_NULLABLE_INT8 = exports.NULLABLE_INT8 = exports.ARRAY_OF_NULLABLE_BOOLEAN = exports.NULLABLE_BOOLEAN = exports.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE = exports.TIMESTAMP_WITH_TIMEZONE = exports.ARRAY_OF_TIMESTAMP = exports.TIMESTAMP = exports.ARRAY_OF_DATE = exports.DATE = exports.ARRAY_OF_TIME = exports.TIME = exports.ARRAY_OF_DECIMAL = exports.DECIMAL = exports.ARRAY_OF_STRING = exports.STRING = exports.ARRAY_OF_FLOAT64 = exports.FLOAT64 = exports.ARRAY_OF_FLOAT32 = exports.FLOAT32 = exports.ARRAY_OF_INT64 = exports.INT64 = exports.ARRAY_OF_INT32 = exports.INT32 = exports.ARRAY_OF_INT16 = exports.INT16 = exports.ARRAY_OF_INT8 = exports.INT8 = exports.ARRAY_OF_BOOLEAN = exports.BOOLEAN = void 0;
const FieldKind_1 = require("./FieldKind");
exports.BOOLEAN = {
    kind: FieldKind_1.FieldKind.BOOLEAN
};
exports.ARRAY_OF_BOOLEAN = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN
};
exports.INT8 = {
    kind: FieldKind_1.FieldKind.INT8
};
exports.ARRAY_OF_INT8 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_INT8
};
exports.INT16 = {
    kind: FieldKind_1.FieldKind.INT16
};
exports.ARRAY_OF_INT16 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_INT16
};
exports.INT32 = {
    kind: FieldKind_1.FieldKind.INT32
};
exports.ARRAY_OF_INT32 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_INT32
};
exports.INT64 = {
    kind: FieldKind_1.FieldKind.INT64
};
exports.ARRAY_OF_INT64 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_INT64
};
exports.FLOAT32 = {
    kind: FieldKind_1.FieldKind.FLOAT32
};
exports.ARRAY_OF_FLOAT32 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_FLOAT32
};
exports.FLOAT64 = {
    kind: FieldKind_1.FieldKind.FLOAT64
};
exports.ARRAY_OF_FLOAT64 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_FLOAT64
};
exports.STRING = {
    kind: FieldKind_1.FieldKind.STRING
};
exports.ARRAY_OF_STRING = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_STRING
};
exports.DECIMAL = {
    kind: FieldKind_1.FieldKind.DECIMAL
};
exports.ARRAY_OF_DECIMAL = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_DECIMAL
};
exports.TIME = {
    kind: FieldKind_1.FieldKind.TIME
};
exports.ARRAY_OF_TIME = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_TIME
};
exports.DATE = {
    kind: FieldKind_1.FieldKind.DATE
};
exports.ARRAY_OF_DATE = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_DATE
};
exports.TIMESTAMP = {
    kind: FieldKind_1.FieldKind.TIMESTAMP
};
exports.ARRAY_OF_TIMESTAMP = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP
};
exports.TIMESTAMP_WITH_TIMEZONE = {
    kind: FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE
};
exports.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE
};
exports.NULLABLE_BOOLEAN = {
    kind: FieldKind_1.FieldKind.NULLABLE_BOOLEAN
};
exports.ARRAY_OF_NULLABLE_BOOLEAN = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN
};
exports.NULLABLE_INT8 = {
    kind: FieldKind_1.FieldKind.NULLABLE_INT8
};
exports.ARRAY_OF_NULLABLE_INT8 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8
};
exports.NULLABLE_INT16 = {
    kind: FieldKind_1.FieldKind.NULLABLE_INT16
};
exports.ARRAY_OF_NULLABLE_INT16 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16
};
exports.NULLABLE_INT32 = {
    kind: FieldKind_1.FieldKind.NULLABLE_INT32
};
exports.ARRAY_OF_NULLABLE_INT32 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32
};
exports.NULLABLE_INT64 = {
    kind: FieldKind_1.FieldKind.NULLABLE_INT64
};
exports.ARRAY_OF_NULLABLE_INT64 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64
};
exports.NULLABLE_FLOAT32 = {
    kind: FieldKind_1.FieldKind.NULLABLE_FLOAT32
};
exports.ARRAY_OF_NULLABLE_FLOAT32 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32
};
exports.NULLABLE_FLOAT64 = {
    kind: FieldKind_1.FieldKind.NULLABLE_FLOAT64
};
exports.ARRAY_OF_NULLABLE_FLOAT64 = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64
};
exports.GENERIC_RECORD = {
    kind: FieldKind_1.FieldKind.COMPACT
};
exports.ARRAY_OF_GENERIC_RECORD = {
    kind: FieldKind_1.FieldKind.ARRAY_OF_COMPACT
};
//# sourceMappingURL=Fields.js.map