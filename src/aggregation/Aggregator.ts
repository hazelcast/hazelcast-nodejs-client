/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
import {DataInput, DataOutput} from '../serialization/Data';
import {IdentifiedDataSerializable} from '../serialization/Serializable';
import * as AggregatorConstants from './AggregatorConstants';
import {HazelcastError} from '../core';

/**
 * Base interface for all aggregators.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Aggregator<R> extends IdentifiedDataSerializable {
}

/** @internal */
export abstract class AbstractAggregator<R> implements Aggregator<R> {

    abstract classId: number;
    factoryId = AggregatorConstants.AGGREGATOR_FACTORY_ID;
    protected attributePath: string;

    constructor(attributePath?: string) {
        this.attributePath = attributePath;
    }

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;
}

/** @internal */
export class CountAggregator extends AbstractAggregator<Long> {

    classId = AggregatorConstants.COUNT;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        // member side field, not used in client
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        // member side field, not used in client
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class DoubleAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.DOUBLE_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readDouble();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class DoubleSumAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.DOUBLE_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readDouble();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeDouble(0);
    }
}

/** @internal */
export class NumberAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.NUMBER_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readDouble();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class FixedPointSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorConstants.FIXED_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class FloatingPointSumAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.FLOATING_POINT_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readDouble();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeDouble(0);
    }
}

/** @internal */
export class MaxAggregator<R> extends AbstractAggregator<R> {

    classId = AggregatorConstants.MAX;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeObject(null);
    }
}

/** @internal */
export class MinAggregator<R> extends AbstractAggregator<R> {

    classId = AggregatorConstants.MIN;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeObject(null);
    }
}

/** @internal */
export class IntegerAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.INT_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readLong();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class IntegerSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorConstants.INT_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class LongAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorConstants.LONG_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readLong();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class LongSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorConstants.LONG_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}

/** @internal */
export class DistinctValuesAggregator<R> extends AbstractAggregator<Set<R>> {

    classId = AggregatorConstants.DISTINCT;

    readData(input: DataInput): any {
        this.attributePath = input.readString();
        const count = input.readInt();
        for (let i = 0; i < count; i++) {
            input.readObject();
        }
    }

    writeData(output: DataOutput): void {
        output.writeString(this.attributePath);
        output.writeInt(0);
    }
}

/** @internal */
export class CanonicalizingHashSet<R> implements IdentifiedDataSerializable, Set<R> {

    classId = AggregatorConstants.CANONICALIZING_SET;
    factoryId = AggregatorConstants.AGGREGATOR_FACTORY_ID;
    private _values = new Set<R>();

    readData(input: DataInput): void {
        const count = input.readInt();
        for (let i = 0; i < count; i++) {
            const element = input.readObject();
            this._values.add(element);
        }
    }

    writeData(output: DataOutput): void {
        output.writeInt(this._values.size);
        for (const element of this._values) {
            output.writeObject(element);
        }
    }

    readonly [Symbol.toStringTag]: string = this._values[Symbol.toStringTag];

    get size() : number {
        return this._values.size;
    }

    [Symbol.iterator](): IterableIterator<R> {
        return undefined;
    }

    add(value: R): this {
        this._values.add(value);
        return this;
    }

    clear(): void {
        this._values.clear();
    }

    delete(value: R): boolean {
        return this._values.delete(value);
    }

    entries(): IterableIterator<[R, R]> {
        return this._values.entries();
    }

    forEach(callbackfn: (value: R, value2: R, set: Set<R>) => void, thisArg?: any): void {
        this._values.forEach(callbackfn, thisArg);
    }

    has(value: R): boolean {
        return this._values.has(value);
    }

    keys(): IterableIterator<R> {
        return this._values.keys();
    }

    values(): IterableIterator<R> {
        return this._values.values();
    }

}

/** @internal */
export const idToConstructor: { [id: number]: new () => Aggregator<any> } = {
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
export function aggregatorFactory(classId: number): IdentifiedDataSerializable {
    try {
        return new idToConstructor[classId]();
    } catch (e) {
        throw new HazelcastError('There is no known aggregator with type id ' + classId, e);
    }
}
