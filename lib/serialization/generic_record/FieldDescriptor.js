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
exports.FieldDescriptor = void 0;
/**
 * Describes a field.
 * @internal
 */
class FieldDescriptor {
    constructor(fieldName, kind) {
        this.fieldName = fieldName;
        this.kind = kind;
        this.index = -1;
        this.offset = -1;
        this.bitOffset = -1;
    }
    equals(other) {
        return this.fieldName === other.fieldName && this.kind === other.kind;
    }
}
exports.FieldDescriptor = FieldDescriptor;
//# sourceMappingURL=FieldDescriptor.js.map