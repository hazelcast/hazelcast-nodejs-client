/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {QueryConstants} from '../core/Predicate';

/**
 * Defines an assortment of transformations which can be applied to
 * {@link BitmapIndexOptions.uniqueKey unique key} values.
 */
export enum UniqueKeyTransformation {

    /**
     * Extracted unique key value is interpreted as an object value.
     * Non-negative unique ID is assigned to every distinct object value.
     */
    OBJECT = 0,

    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary) and unique non-negative ID is assigned to every
     * distinct value.
     */
    LONG = 1,

    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary) and the resulting value is used directly as an ID.
     */
    RAW = 2,

}

export type UniqueKeyTransformationStrings = keyof typeof UniqueKeyTransformation;

const DEFAULT_UNIQUE_KEY = QueryConstants.KEY_ATTRIBUTE_NAME;
const DEFAULT_UNIQUE_KEY_TRANSFORMATION = UniqueKeyTransformation.OBJECT;

/**
 * Configures indexing options specific to bitmap indexes.
 */
export interface BitmapIndexOptions {

    /**
     * Unique key attribute configured in this index config.
     * Defaults to `__key`. The unique key attribute is used as a source
     * of values which uniquely identify each entry being inserted into an index.
     */
    uniqueKey?: string;

    /**
     * Unique key transformation configured in this index. The transformation is
     * applied to every value extracted from unique key attribute. Defaults
     * to `OBJECT`. Available values are `OBJECT`, `LONG`, and `RAW`.
     */
    uniqueKeyTransformation?: UniqueKeyTransformationStrings;

}

/**
 * Follows the shape of {@link BitmapIndexOptions}, but doesn't implement it due
 * to the `uniqueKeyTransformation` enum field.
 * @internal
 */
export class InternalBitmapIndexOptions {

    uniqueKey: string;
    uniqueKeyTransformation: UniqueKeyTransformation;

    constructor(uniqueKey: string = DEFAULT_UNIQUE_KEY,
                uniqueKeyTransformation: UniqueKeyTransformation = DEFAULT_UNIQUE_KEY_TRANSFORMATION) {
        this.uniqueKey = uniqueKey;
        this.uniqueKeyTransformation = uniqueKeyTransformation;
    }

    toString(): string {
        return 'BitmapIndexOptions[' +
            'uniqueKey: ' + this.uniqueKey +
            ', uniqueKeyTransformation: ' + this.uniqueKeyTransformation +
            ']';
    }

}
