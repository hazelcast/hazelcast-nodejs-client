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

import {DataInput, DataOutput} from '../serialization';
import {
    LocalDate,
    LocalDateTime,
    OffsetDateTime,
} from '../core';
import {IOUtil} from './IOUtil';

/** @internal */
export class PortableUtil {

    static readLocalDateForPortable(inp: DataInput): LocalDate {
        const year = inp.readShort(); // this is different due to backward compatibility
        const month = inp.readByte();
        const date = inp.readByte();
        return new LocalDate(year, month, date);
    }

    static readLocalDatetimeForPortable(inp: DataInput): LocalDateTime {
        const localDate = PortableUtil.readLocalDateForPortable(inp);
        const localTime = IOUtil.readLocalTime(inp);

        return new LocalDateTime(localDate, localTime);
    }

    static readOffsetDatetimeForPortable(inp: DataInput): OffsetDateTime {
        const localDate = PortableUtil.readLocalDateForPortable(inp);
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


    static writeLocalDateForPortable(out: DataOutput, value: LocalDate): void {
        out.writeShort(value.year); // this is different due to backward compatibility
        out.writeByte(value.month);
        out.writeByte(value.date);
    }

    static writeLocalDatetimeForPortable(out: DataOutput, value: LocalDateTime): void {
        PortableUtil.writeLocalDateForPortable(out, value.localDate);
        IOUtil.writeLocalTime(out, value.localTime);
    }

    static writeOffsetDatetimeForPortable(out: DataOutput, value: OffsetDateTime): void {
        PortableUtil.writeLocalDatetimeForPortable(out, value.localDateTime);
        out.writeInt(value.offsetSeconds);
    }

}
