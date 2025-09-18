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
exports.aggregatorFactory = exports.idToConstructor = exports.CanonicalizingHashSet = exports.DistinctValuesAggregator = exports.LongSumAggregator = exports.LongAverageAggregator = exports.IntegerSumAggregator = exports.IntegerAverageAggregator = exports.MinAggregator = exports.MaxAggregator = exports.FloatingPointSumAggregator = exports.FixedPointSumAggregator = exports.NumberAverageAggregator = exports.DoubleSumAggregator = exports.DoubleAverageAggregator = exports.CountAggregator = exports.AbstractAggregator = void 0;
const Long = require("long");
const AggregatorConstants = require("./AggregatorConstants");
const core_1 = require("../core");
/** @internal */
class AbstractAggregator {
    constructor(attributePath) {
        this.factoryId = AggregatorConstants.AGGREGATOR_FACTORY_ID;
        this.attributePath = attributePath;
    }
}
exports.AbstractAggregator = AbstractAggregator;
/** @internal */
class CountAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.COUNT;
    }
    readData(input) {
        this.attributePath = input.readString();
        // member side field, not used in client
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        // member side field, not used in client
        output.writeLong(Long.ZERO);
    }
}
exports.CountAggregator = CountAggregator;
/** @internal */
class DoubleAverageAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.DOUBLE_AVG;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readDouble();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}
exports.DoubleAverageAggregator = DoubleAverageAggregator;
/** @internal */
class DoubleSumAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.DOUBLE_SUM;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readDouble();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeDouble(0);
    }
}
exports.DoubleSumAggregator = DoubleSumAggregator;
/** @internal */
class NumberAverageAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.NUMBER_AVG;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readDouble();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}
exports.NumberAverageAggregator = NumberAverageAggregator;
/** @internal */
class FixedPointSumAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.FIXED_SUM;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}
exports.FixedPointSumAggregator = FixedPointSumAggregator;
/** @internal */
class FloatingPointSumAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.FLOATING_POINT_SUM;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readDouble();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeDouble(0);
    }
}
exports.FloatingPointSumAggregator = FloatingPointSumAggregator;
/** @internal */
class MaxAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.MAX;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readObject();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeObject(null);
    }
}
exports.MaxAggregator = MaxAggregator;
/** @internal */
class MinAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.MIN;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readObject();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeObject(null);
    }
}
exports.MinAggregator = MinAggregator;
/** @internal */
class IntegerAverageAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.INT_AVG;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readLong();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}
exports.IntegerAverageAggregator = IntegerAverageAggregator;
/** @internal */
class IntegerSumAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.INT_SUM;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}
exports.IntegerSumAggregator = IntegerSumAggregator;
/** @internal */
class LongAverageAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.LONG_AVG;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readLong();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}
exports.LongAverageAggregator = LongAverageAggregator;
/** @internal */
class LongSumAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.LONG_SUM;
    }
    readData(input) {
        this.attributePath = input.readString();
        input.readLong();
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}
exports.LongSumAggregator = LongSumAggregator;
/** @internal */
class DistinctValuesAggregator extends AbstractAggregator {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.DISTINCT;
    }
    readData(_input) {
        // readData is not used on the client side
    }
    writeData(output) {
        output.writeString(this.attributePath);
        output.writeInt(0);
    }
}
exports.DistinctValuesAggregator = DistinctValuesAggregator;
/** @internal */
class CanonicalizingHashSet extends Set {
    constructor() {
        super(...arguments);
        this.classId = AggregatorConstants.CANONICALIZING_SET;
        this.factoryId = AggregatorConstants.AGGREGATOR_FACTORY_ID;
    }
    readData(input) {
        const count = input.readInt();
        for (let i = 0; i < count; i++) {
            const element = input.readObject();
            this.add(element);
        }
    }
    writeData(_output) {
        // writeData is not used on the client side
    }
}
exports.CanonicalizingHashSet = CanonicalizingHashSet;
/** @internal */
exports.idToConstructor = {
    [AggregatorConstants.COUNT]: CountAggregator,
    [AggregatorConstants.DISTINCT]: DistinctValuesAggregator,
    [AggregatorConstants.DOUBLE_AVG]: DoubleAverageAggregator,
    [AggregatorConstants.DOUBLE_SUM]: DoubleSumAggregator,
    [AggregatorConstants.FIXED_SUM]: FixedPointSumAggregator,
    [AggregatorConstants.FLOATING_POINT_SUM]: FloatingPointSumAggregator,
    [AggregatorConstants.INT_AVG]: IntegerAverageAggregator,
    [AggregatorConstants.INT_SUM]: IntegerSumAggregator,
    [AggregatorConstants.LONG_AVG]: LongAverageAggregator,
    [AggregatorConstants.LONG_SUM]: LongSumAggregator,
    [AggregatorConstants.MAX]: MaxAggregator,
    [AggregatorConstants.MIN]: MinAggregator,
    [AggregatorConstants.NUMBER_AVG]: NumberAverageAggregator,
    [AggregatorConstants.CANONICALIZING_SET]: CanonicalizingHashSet
};
/** @internal */
function aggregatorFactory(classId) {
    try {
        return new exports.idToConstructor[classId]();
    }
    catch (e) {
        throw new core_1.HazelcastError('There is no known aggregator with type id ' + classId, e);
    }
}
exports.aggregatorFactory = aggregatorFactory;
//# sourceMappingURL=Aggregator.js.map