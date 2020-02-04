/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import {Buffer} from 'safe-buffer';
import * as Long from 'long';
import {BitsUtil} from '../../BitsUtil';
import {UUID} from '../../core/UUID';

export class FixSizedTypesCodec {
    static encodeInt(buffer: Buffer, offset: number, value: number): void {
        buffer.writeInt32LE(value, offset);
    }

    static decodeInt(buffer: Buffer, offset: number): number {
        return buffer.readInt32LE(offset);
    }

    static encodeLong(buffer: Buffer, offset: number, value: any): void {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }

        buffer.writeInt32LE(value.low, offset);
        buffer.writeInt32LE(value.high, offset + BitsUtil.INT_SIZE_IN_BYTES);
    }

    static decodeLong(buffer: Buffer, offset: number): Long {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + BitsUtil.INT_SIZE_IN_BYTES);
        return new Long(low, high);
    }

    static encodeBoolean(buffer: Buffer, offset: number, value: boolean): void {
        buffer.writeUInt8(value ? 1 : 0, offset);
    }

    static decodeBoolean(buffer: Buffer, offset: number): boolean {
        return buffer.readUInt8(offset) === 1;
    }

    static encodeByte(buffer: Buffer, offset: number, value: number): void {
        buffer.writeUInt8(value, offset);
    }

    static decodeByte(buffer: Buffer, offset: number): number {
        return buffer.readUInt8(offset);
    }

    static encodeUUID(buffer: Buffer, offset: number, value: UUID): void {
        const isNull = value === null;
        this.encodeBoolean(buffer, offset, isNull);
        if (isNull) {
            return;
        }
        const mostSignificantBits = value.mostSignificant;
        const leastSignificantBits = value.leastSignificant;
        this.encodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES, mostSignificantBits);
        this.encodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES, leastSignificantBits);
    }

    static decodeUUID(buffer: Buffer, offset: number): UUID {
        const isNull = this.decodeBoolean(buffer, offset);
        if (isNull) {
            return null;
        }
        const mostSignificantBits = this.decodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES);
        const leastSignificantBits = this.decodeLong(buffer,
            offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES);
        return new UUID(mostSignificantBits, leastSignificantBits);
    }
}
