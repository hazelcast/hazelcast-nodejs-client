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
/** @ignore *//** */
import {Big, BigDecimal, HzLocalDate, HzLocalDateTime, HzLocalTime, HzOffsetDateTime} from '../core';
import {fromBufferAndScale} from './BigDecimalUtil';
import {DataInput, DataOutput} from '../serialization';

/** @internal */
export class IOUtil {

    static readDecimal(inp: DataInput): BigDecimal {
        const buffer = inp.readByteArray();
        const scale = inp.readInt();
        return Big(fromBufferAndScale(buffer, scale));
    }

    static readHzLocalTime(inp: DataInput): HzLocalTime {
        const hour = inp.readByte();
        const minute = inp.readByte();
        const second = inp.readByte();
        const nano = inp.readInt();
        return new HzLocalTime(hour, minute, second, nano);
    }

    static readHzLocalDate(inp: DataInput): HzLocalDate {
        const year = inp.readShort();
        const month = inp.readByte();
        const date = inp.readByte();
        return new HzLocalDate(year, month, date);
    }

    static readHzLocalDatetime(inp: DataInput): HzLocalDateTime {
        const year = inp.readShort();
        const month = inp.readByte();
        const date = inp.readByte();

        const hour = inp.readByte();
        const minute = inp.readByte();
        const second = inp.readByte();
        const nano = inp.readInt();

        return new HzLocalDateTime(new HzLocalDate(year, month, date), new HzLocalTime(hour, minute, second, nano));
    }

    static readHzOffsetDatetime(inp: DataInput): HzOffsetDateTime {
        const year = inp.readShort();
        const month = inp.readByte();
        const date = inp.readByte();

        const hour = inp.readByte();
        const minute = inp.readByte();
        const second = inp.readByte();
        const nano = inp.readInt();

        const offsetSeconds = inp.readInt();

        return new HzOffsetDateTime(
            new HzLocalDateTime(
                new HzLocalDate(year, month, date),
                new HzLocalTime(hour, minute, second, nano)
            ),
            offsetSeconds
        );
    }

    static writeDecimal(inp: DataOutput, value: BigDecimal): void {

    }

    static writeHzLocalTime(inp: DataOutput, value: HzLocalTime): void {

    }

    static writeHzLocalDate(inp: DataOutput, value: HzLocalDate): void {

    }

    static writeHzLocalDatetime(inp: DataOutput, value: HzLocalDateTime): void {

    }

    static writeHzOffsetDatetime(inp: DataOutput, value: HzOffsetDateTime): void {

    }

}


