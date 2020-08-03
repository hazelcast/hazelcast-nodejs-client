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

import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from '../serialization/Serializable';
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

export class AggregatorFactory implements IdentifiedDataSerializableFactory {

    static readonly FACTORY_ID = -29;

    static readonly BIG_DECIMAL_AVG = 0; // not implemented in node.js
    static readonly BIG_DECIMAL_SUM = 1; // not implemented in node.js
    static readonly BIG_INT_AVG = 2; // not implemented in node.js
    static readonly BIG_INT_SUM = 3; // not implemented in node.js
    static readonly COUNT = 4;
    static readonly DISTINCT = 5; // returns java serializable, not usable in node.js
    static readonly DOUBLE_AVG = 6;
    static readonly DOUBLE_SUM = 7;
    static readonly FIXED_SUM = 8;
    static readonly FLOATING_POINT_SUM = 9;
    static readonly INT_AVG = 10;
    static readonly INT_SUM = 11;
    static readonly LONG_AVG = 12;
    static readonly LONG_SUM = 13;
    static readonly MAX = 14;
    static readonly MIN = 15;
    static readonly NUMBER_AVG = 16;
    static readonly MAX_BY = 17; // needs object to implement Java's Comparable interface
    static readonly MIN_BY = 18; // needs object to implement Java's Comparable interface

    private idToConstructor: { [id: number]: Aggregator<any> } = {};

    constructor() {
        this.idToConstructor[AggregatorFactory.COUNT] = CountAggregator;
        this.idToConstructor[AggregatorFactory.DOUBLE_AVG] = DoubleAverageAggregator;
        this.idToConstructor[AggregatorFactory.DOUBLE_SUM] = DoubleSumAggregator;
        this.idToConstructor[AggregatorFactory.FIXED_SUM] = FixedPointSumAggregator;
        this.idToConstructor[AggregatorFactory.FLOATING_POINT_SUM] = FloatingPointSumAggregator;
        this.idToConstructor[AggregatorFactory.INT_AVG] = IntegerAverageAggregator;
        this.idToConstructor[AggregatorFactory.INT_SUM] = IntegerSumAggregator;
        this.idToConstructor[AggregatorFactory.LONG_AVG] = LongAverageAggregator;
        this.idToConstructor[AggregatorFactory.LONG_SUM] = LongSumAggregator;
        this.idToConstructor[AggregatorFactory.MAX] = MaxAggregator;
        this.idToConstructor[AggregatorFactory.MIN] = MinAggregator;
        this.idToConstructor[AggregatorFactory.NUMBER_AVG] = NumberAverageAggregator;
    }

    create(type: number): IdentifiedDataSerializable {
        try {
            return (new (this.idToConstructor[type] as FunctionConstructor)()) as any;
        } catch (e) {
            throw new HazelcastError('There is no known aggregator with type id ' + type, e);
        }
    }

}
