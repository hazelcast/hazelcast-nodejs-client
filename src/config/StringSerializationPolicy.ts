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

/**
 * Using this policy, one can control the
 * serialization type of strings.
 */
export enum StringSerializationPolicy {
    /**
     * Strings are serialized and deserialized
     * according to UTF-8 standard (RFC 3629).
     *
     * May lead to server-side compatibility
     * issues with IMDG 3.x for 4 byte characters,
     * like less common CJK characters and emoji.
     */
    STANDARD,

    /**
     * 4 byte characters are represented as
     * 6 bytes during serialization/deserialization
     * (non-standard UTF-8). Provides full compatibility
     * with IMDG 3.x members and other clients.
     */
    LEGACY,
}
