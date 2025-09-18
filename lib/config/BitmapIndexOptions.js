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
exports.InternalBitmapIndexOptions = exports.UniqueKeyTransformation = void 0;
const Predicate_1 = require("../core/Predicate");
/**
 * Defines an assortment of transformations which can be applied to
 * {@link BitmapIndexOptions.uniqueKey unique key} values.
 */
var UniqueKeyTransformation;
(function (UniqueKeyTransformation) {
    /**
     * Extracted unique key value is interpreted as an object value.
     * Non-negative unique ID is assigned to every distinct object value.
     */
    UniqueKeyTransformation[UniqueKeyTransformation["OBJECT"] = 0] = "OBJECT";
    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary) and unique non-negative ID is assigned to every
     * distinct value.
     */
    UniqueKeyTransformation[UniqueKeyTransformation["LONG"] = 1] = "LONG";
    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary), and the resulting value is used directly as an ID.
     */
    UniqueKeyTransformation[UniqueKeyTransformation["RAW"] = 2] = "RAW";
})(UniqueKeyTransformation = exports.UniqueKeyTransformation || (exports.UniqueKeyTransformation = {}));
const DEFAULT_UNIQUE_KEY = Predicate_1.QueryConstants.KEY_ATTRIBUTE_NAME;
const DEFAULT_UNIQUE_KEY_TRANSFORMATION = UniqueKeyTransformation.OBJECT;
/**
 * Follows the shape of {@link BitmapIndexOptions}, but doesn't implement it due
 * to the `uniqueKeyTransformation` enum field.
 * @internal
 */
class InternalBitmapIndexOptions {
    constructor(uniqueKey = DEFAULT_UNIQUE_KEY, uniqueKeyTransformation = DEFAULT_UNIQUE_KEY_TRANSFORMATION) {
        this.uniqueKey = uniqueKey;
        this.uniqueKeyTransformation = uniqueKeyTransformation;
    }
    toString() {
        return 'BitmapIndexOptions[' +
            'uniqueKey: ' + this.uniqueKey +
            ', uniqueKeyTransformation: ' + this.uniqueKeyTransformation +
            ']';
    }
}
exports.InternalBitmapIndexOptions = InternalBitmapIndexOptions;
//# sourceMappingURL=BitmapIndexOptions.js.map