/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

export class Utils {
    public static getStringSize(value: string, nullable: boolean = false): number {
        // int32 for string length
        let size = 4;

        if (nullable) {
            size += 1;
        }

        size += value == null ? 0 : value.length;

        return size;
    }

    public static calculateSizeString(value: string) {
        return this.getStringSize(value);
    }

    public static calculateSizeBuffer(value: Buffer) {
        let size = 4;
        size += value.length;
        return size;
    }
}
