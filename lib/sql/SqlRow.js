"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlRowImpl = void 0;
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
const SqlRowMetadata_1 = require("./SqlRowMetadata");
const core_1 = require("../core");
/** @internal */
class SqlRowImpl {
    constructor(values, rowMetadata, deserializeFn) {
        this.values = values;
        this.rowMetadata = rowMetadata;
        this.deserializeFn = deserializeFn;
    }
    getObject(columnNameOrIndex) {
        let columnIndex;
        if (typeof columnNameOrIndex === 'number') {
            columnIndex = columnNameOrIndex;
        }
        else if (typeof columnNameOrIndex === 'string') {
            columnIndex = this.rowMetadata.findColumn(columnNameOrIndex);
            if (columnIndex === SqlRowMetadata_1.SqlRowMetadataImpl.COLUMN_NOT_FOUND) {
                throw new core_1.IllegalArgumentError(`Could not find a column with name ${columnNameOrIndex}`);
            }
        }
        else {
            throw new core_1.IllegalArgumentError('Expected string or number for column argument');
        }
        return this.deserializeFn(this.values[columnIndex], true);
    }
    getMetadata() {
        return this.rowMetadata;
    }
}
exports.SqlRowImpl = SqlRowImpl;
//# sourceMappingURL=SqlRow.js.map