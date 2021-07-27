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
import {
    BigDecimal,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
} from '../core';
import {bufferToBigInt, bigIntToBuffer} from './BigDecimalUtil';
import {DataInput, DataOutput} from '../serialization';

/** @internal */
export class IOUtil {

    static readDecimal(inp: DataInput): BigDecimal {
        const buffer = inp.readByteArray();
        const scale = inp.readInt();
        return new BigDecimal(bufferToBigInt(buffer), scale);
    }

    static readLocalTime(inp: DataInput): LocalTime {
        const hour = inp.readByte();
        const minute = inp.readByte();
        const second = inp.readByte();
        const nano = inp.readInt();
        return new LocalTime(hour, minute, second, nano);
    }

    static readLocalDate(inp: DataInput): LocalDate {
        const year = inp.readInt();
        const month = inp.readByte();
        const date = inp.readByte();
        return new LocalDate(year, month, date);
    }

    static readLocalDatetime(inp: DataInput): LocalDateTime {
        const localDate = IOUtil.readLocalDate(inp);
        const localTime = IOUtil.readLocalTime(inp);

        return new LocalDateTime(localDate, localTime);
    }

    static readOffsetDatetime(inp: DataInput): OffsetDateTime {
        const localDate = IOUtil.readLocalDate(inp);
        const localTime = IOUtil.readLocalTime(inp);

        const offsetSeconds = inp.readInt();

        return new OffsetDateTime(
            new LocalDateTime(
                localDate,
                localTime
            ),
            offsetSeconds
        );
    }

    static writeDecimal(out: DataOutput, value: BigDecimal): void {
        out.writeByteArray(bigIntToBuffer(value.unscaledValue));
        out.writeInt(value.scale);
    }

    static writeLocalTime(out: DataOutput, value: LocalTime): void {
        out.writeByte(value.hour);
        out.writeByte(value.minute);
        out.writeByte(value.second);
        out.writeInt(value.nano);
    }

    static writeLocalDate(out: DataOutput, value: LocalDate): void {
        out.writeInt(value.year);
        out.writeByte(value.month);
        out.writeByte(value.date);
    }

    static writeLocalDatetime(out: DataOutput, value: LocalDateTime): void {
        IOUtil.writeLocalDate(out, value.localDate);
        IOUtil.writeLocalTime(out, value.localTime);
    }

    static writeOffsetDatetime(out: DataOutput, value: OffsetDateTime): void {
        IOUtil.writeLocalDatetime(out, value.localDateTime);
        out.writeInt(value.offsetSeconds);
    }

}
