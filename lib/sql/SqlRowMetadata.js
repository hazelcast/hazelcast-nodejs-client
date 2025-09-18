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
exports.SqlRowMetadataImpl = void 0;
const core_1 = require("../core");
/** @internal */
class SqlRowMetadataImpl {
    constructor(columns) {
        this.columns = columns;
        this.nameToIndex = {};
        for (let i = 0; i < columns.length; i++) {
            this.nameToIndex[columns[i].name] = i;
        }
    }
    getColumnCount() {
        return this.columns.length;
    }
    getColumn(index) {
        return this.columns[index];
    }
    getColumns() {
        return this.columns;
    }
    findColumn(columnName) {
        if (typeof columnName !== 'string') {
            throw new core_1.IllegalArgumentError(`Expected string got type ${typeof columnName}`);
        }
        const columnIndex = this.nameToIndex[columnName];
        return columnIndex !== undefined ? columnIndex : SqlRowMetadataImpl.COLUMN_NOT_FOUND;
    }
}
exports.SqlRowMetadataImpl = SqlRowMetadataImpl;
SqlRowMetadataImpl.COLUMN_NOT_FOUND = -1;
//# sourceMappingURL=SqlRowMetadata.js.map