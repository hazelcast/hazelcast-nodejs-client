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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortableUtil = void 0;
const core_1 = require("../core");
const IOUtil_1 = require("./IOUtil");
/** @internal */
class PortableUtil {
    static readLocalDate(inp) {
        const year = inp.readShort(); // this is different due to backward compatibility
        const month = inp.readByte();
        const date = inp.readByte();
        return new core_1.LocalDate(year, month, date);
    }
    static readLocalDateTime(inp) {
        const localDate = PortableUtil.readLocalDate(inp);
        const localTime = IOUtil_1.IOUtil.readLocalTime(inp);
        return new core_1.LocalDateTime(localDate, localTime);
    }
    static readOffsetDateTime(inp) {
        const localDate = PortableUtil.readLocalDate(inp);
        const localTime = IOUtil_1.IOUtil.readLocalTime(inp);
        const offsetSeconds = inp.readInt();
        return new core_1.OffsetDateTime(new core_1.LocalDateTime(localDate, localTime), offsetSeconds);
    }
    static writeLocalDate(out, value) {
        out.writeShort(value.year); // this is different due to backward compatibility
        out.writeByte(value.month);
        out.writeByte(value.date);
    }
    static writeLocalDateTime(out, value) {
        PortableUtil.writeLocalDate(out, value.localDate);
        IOUtil_1.IOUtil.writeLocalTime(out, value.localTime);
    }
    static writeOffsetDateTime(out, value) {
        PortableUtil.writeLocalDateTime(out, value.localDateTime);
        out.writeInt(value.offsetSeconds);
    }
}
exports.PortableUtil = PortableUtil;
//# sourceMappingURL=PortableUtil.js.map