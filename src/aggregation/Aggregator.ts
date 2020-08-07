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

import * as Long from 'long';
import {DataInput, DataOutput} from '../serialization/Data';
import {IdentifiedDataSerializable} from '../serialization/Serializable';
import * as AggregatorFactory from './AggregatorFactory';

export interface Aggregator<R> extends IdentifiedDataSerializable {
}

export abstract class AbstractAggregator<R> implements Aggregator<R> {

    abstract classId: number;
    factoryId = AggregatorFactory.AGGREGATOR_FACTORY_ID;
    protected attributePath: string;

    constructor(attributePath?: string) {
        this.attributePath = attributePath;
    }

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;
}

export class CountAggregator extends AbstractAggregator<Long> {

    classId = AggregatorFactory.COUNT;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        // member side field, not used in client
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        // member side field, not used in client
        output.writeLong(Long.ZERO);
    }
}

export class DoubleAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.DOUBLE_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readDouble();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}

export class DoubleSumAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.DOUBLE_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readDouble();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeDouble(0);
    }
}

export class NumberAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.NUMBER_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readDouble();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeDouble(0);
        output.writeLong(Long.ZERO);
    }
}

export class FixedPointSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorFactory.FIXED_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}

export class FloatingPointSumAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.FLOATING_POINT_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readDouble();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeDouble(0);
    }
}

export class MaxAggregator<R> extends AbstractAggregator<R> {

    classId = AggregatorFactory.MAX;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeObject(null);
    }
}

export class MinAggregator<R> extends AbstractAggregator<R> {

    classId = AggregatorFactory.MIN;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeObject(null);
    }
}

export class IntegerAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.INT_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readLong();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}

export class IntegerSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorFactory.INT_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}

export class LongAverageAggregator extends AbstractAggregator<number> {

    classId = AggregatorFactory.LONG_AVG;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readLong();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeLong(Long.ZERO);
        output.writeLong(Long.ZERO);
    }
}

export class LongSumAggregator extends AbstractAggregator<Long> {

    classId = AggregatorFactory.LONG_SUM;

    readData(input: DataInput): any {
        this.attributePath = input.readUTF();
        input.readLong();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.attributePath);
        output.writeLong(Long.ZERO);
    }
}
