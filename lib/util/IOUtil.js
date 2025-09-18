"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOUtil = void 0;
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
/** @ignore */ /** */
const core_1 = require("../core");
const BigDecimalUtil_1 = require("./BigDecimalUtil");
/** @internal */
class IOUtil {
    static readDecimal(inp) {
        const buffer = inp.readByteArray();
        const scale = inp.readInt();
        return new core_1.BigDecimal((0, BigDecimalUtil_1.bufferToBigInt)(buffer), scale);
    }
    static readLocalTime(inp) {
        const hour = inp.readByte();
        const minute = inp.readByte();
        const second = inp.readByte();
        const nano = inp.readInt();
        return new core_1.LocalTime(hour, minute, second, nano);
    }
    static readLocalDate(inp) {
        const year = inp.readInt();
        const month = inp.readByte();
        const date = inp.readByte();
        return new core_1.LocalDate(year, month, date);
    }
    static readLocalDateTime(inp) {
        const localDate = IOUtil.readLocalDate(inp);
        const localTime = IOUtil.readLocalTime(inp);
        return new core_1.LocalDateTime(localDate, localTime);
    }
    static readOffsetDateTime(inp) {
        const localDateTime = IOUtil.readLocalDateTime(inp);
        const offsetSeconds = inp.readInt();
        return new core_1.OffsetDateTime(localDateTime, offsetSeconds);
    }
    static writeDecimal(out, value) {
        out.writeByteArray((0, BigDecimalUtil_1.bigIntToBuffer)(value.unscaledValue));
        out.writeInt(value.scale);
    }
    static writeLocalTime(out, value) {
        out.writeByte(value.hour);
        out.writeByte(value.minute);
        out.writeByte(value.second);
        out.writeInt(value.nano);
    }
    static writeLocalDate(out, value) {
        out.writeInt(value.year);
        out.writeByte(value.month);
        out.writeByte(value.date);
    }
    static writeLocalDateTime(out, value) {
        IOUtil.writeLocalDate(out, value.localDate);
        IOUtil.writeLocalTime(out, value.localTime);
    }
    static writeOffsetDateTime(out, value) {
        IOUtil.writeLocalDateTime(out, value.localDateTime);
        out.writeInt(value.offsetSeconds);
    }
}
exports.IOUtil = IOUtil;
//# sourceMappingURL=IOUtil.js.map