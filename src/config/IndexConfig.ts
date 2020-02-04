/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import {IndexType} from './IndexType';
import {BitmapIndexOptions} from './BitmapIndexOptions';
import {IndexUtil} from '../util/IndexUtil';

/**
 * Configuration of an index. Hazelcast support two types of indexes: sorted index and hash index.
 * Sorted indexes could be used with equality and range predicates and have logarithmic search time.
 * Hash indexes could be used with equality predicates and have constant search time assuming the hash
 * function of the indexed field disperses the elements properly.
 *
 * Index could be created on one or more attributes.
 *
 * @see {@link IndexType}
 */
export class IndexConfig {
    /**
     * Default index type.
     */
    public static readonly DEFAULT_TYPE = IndexType.SORTED;

    /**
     * Name of the index.
     */
    name: string;

    /**
     * Type of the index.
     */
    type: IndexType = IndexConfig.DEFAULT_TYPE;

    /**
     * Indexed attributes.
     */
    attributes: string[];

    bitmapIndexOptions: BitmapIndexOptions;

    constructor(name?: string, type?: IndexType, attributes?: string[], bitmapIndexOptions?: BitmapIndexOptions) {
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

    addAttribute(attribute: string): IndexConfig {
        IndexUtil.validateAttribute(this, attribute);
        this.attributes.push(attribute);
        return this;
    }
}
