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
/** @ignore *//** */

import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {
    Aggregator,
    CountAggregator,
    DoubleAverageAggregator,
    DoubleSumAggregator,
    FixedPointSumAggregator,
    FloatingPointSumAggregator,
    IntegerAverageAggregator,
    IntegerSumAggregator,
    LongAverageAggregator,
    LongSumAggregator,
    MaxAggregator,
    MinAggregator,
    NumberAverageAggregator,
} from './Aggregator';
import {HazelcastError} from '../HazelcastError';

/** @internal */
export const AGGREGATOR_FACTORY_ID = -29;

// export const BIG_DECIMAL_AVG = 0; // not implemented in node.js
// export const BIG_DECIMAL_SUM = 1; // not implemented in node.js
// export const BIG_INT_AVG = 2; // not implemented in node.js
// export const BIG_INT_SUM = 3; // not implemented in node.js
/** @internal */
export const COUNT = 4;
// export const DISTINCT = 5; // returns java serializable, not usable in node.js
/** @internal */
export const DOUBLE_AVG = 6;
/** @internal */
export const DOUBLE_SUM = 7;
/** @internal */
export const FIXED_SUM = 8;
/** @internal */
export const FLOATING_POINT_SUM = 9;
/** @internal */
export const INT_AVG = 10;
/** @internal */
export const INT_SUM = 11;
/** @internal */
export const LONG_AVG = 12;
/** @internal */
export const LONG_SUM = 13;
/** @internal */
export const MAX = 14;
/** @internal */
export const MIN = 15;
/** @internal */
export const NUMBER_AVG = 16;
// export const MAX_BY = 17; // needs object to implement Java's Comparable interface
// export const MIN_BY = 18; // needs object to implement Java's Comparable interface

const idToConstructor: { [id: number]: new () => Aggregator<any> } = {
    [COUNT]: CountAggregator,
    [DOUBLE_AVG]: DoubleAverageAggregator,
    [DOUBLE_SUM]: DoubleSumAggregator,
    [FIXED_SUM]: FixedPointSumAggregator,
    [FLOATING_POINT_SUM]: FloatingPointSumAggregator,
    [INT_AVG]: IntegerAverageAggregator,
    [INT_SUM]: IntegerSumAggregator,
    [LONG_AVG]: LongAverageAggregator,
    [LONG_SUM]: LongSumAggregator,
    [MAX]: MaxAggregator,
    [MIN]: MinAggregator,
    [NUMBER_AVG]: NumberAverageAggregator,
};

/** @internal */
export function aggregatorFactory(classId: number): IdentifiedDataSerializable {
    try {
        return new idToConstructor[classId]();
    } catch (e) {
        throw new HazelcastError('There is no known aggregator with type id ' + classId, e);
    }
}
