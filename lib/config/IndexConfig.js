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
exports.InternalIndexConfig = void 0;
const IndexType_1 = require("./IndexType");
/**
 * Follows the shape of {@link IndexConfig}, but doesn't implement it due
 * to the `type` enum field.
 * @internal
 */
class InternalIndexConfig {
    constructor(name, type, attributes, bitmapIndexOptions) {
        this.type = InternalIndexConfig.DEFAULT_TYPE;
        this.attributes = [];
        if (name) {
            this.name = name;
        }
        if (type) {
            this.type = type;
        }
        if (attributes) {
            this.attributes = attributes;
        }
        if (bitmapIndexOptions) {
            this.bitmapIndexOptions = bitmapIndexOptions;
        }
    }
    toString() {
        let bitmapIndexOptions;
        if (this.bitmapIndexOptions == null) {
            bitmapIndexOptions = undefined;
        }
        else {
            bitmapIndexOptions = this.bitmapIndexOptions.toString();
        }
        return 'IndexConfig[' +
            'name: ' + this.name +
            ', type: ' + this.type +
            ', attributes: ' + this.attributes +
            ', bitmapIndexOptions: ' + bitmapIndexOptions +
            ']';
    }
}
exports.InternalIndexConfig = InternalIndexConfig;
/**
 * Default index type.
 */
InternalIndexConfig.DEFAULT_TYPE = IndexType_1.IndexType.SORTED;
//# sourceMappingURL=IndexConfig.js.map