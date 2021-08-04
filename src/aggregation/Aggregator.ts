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
import {
    AGGREGATOR_FACTORY_ID,
    CANONICALIZING_SET,
    COUNT,
    DISTINCT,
    DOUBLE_AVG,
    DOUBLE_SUM,
    FIXED_SUM,
    FLOATING_POINT_SUM,
    INT_AVG,
    INT_SUM,
    LONG_AVG,
    LONG_SUM,
    MAX,
    MIN,
    NUMBER_AVG
} from './AggregatorConstants';
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
    factoryId = AGGREGATOR_FACTORY_ID;
    protected attributePath: string;

    constructor(attributePath?: string) {
        this.attributePath = attributePath;
    }

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;
}

/** @internal */
export class CountAggregator extends AbstractAggregator<Long> {

    classId = COUNT;

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

    classId = DOUBLE_AVG;

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

    classId = DOUBLE_SUM;

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

    classId = NUMBER_AVG;

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

    classId = FIXED_SUM;

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

    classId = FLOATING_POINT_SUM;

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

    classId = MAX;

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

    classId = MIN;

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

    classId = INT_AVG;

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

    classId = INT_SUM;

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

    classId = LONG_AVG;

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

    classId = LONG_SUM;

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

    classId = DISTINCT;

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

    classId = CANONICALIZING_SET;
    factoryId = AGGREGATOR_FACTORY_ID;
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
    [COUNT]: CountAggregator,
    [DISTINCT]: DistinctValuesAggregator,
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
    [CANONICALIZING_SET]: CanonicalizingHashSet
};

/** @internal */
export function aggregatorFactory(classId: number): IdentifiedDataSerializable {
    try {
        return new idToConstructor[classId]();
    } catch (e) {
        throw new HazelcastError('There is no known aggregator with type id ' + classId, e);
    }
}
