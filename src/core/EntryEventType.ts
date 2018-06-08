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

/* tslint:disable:no-bitwise */
export enum EntryEventType {
    ADDED = 1 << 0,
    REMOVED = 1 << 1,
    UPDATED = 1 << 2,
    EVICTED = 1 << 3,
    EVICT_ALL = 1 << 4,
    CLEAR_ALL = 1 << 5,
    MERGED = 1 << 6,
    EXPIRED = 1 << 7,
    INVALIDATION = 1 << 8,
}
