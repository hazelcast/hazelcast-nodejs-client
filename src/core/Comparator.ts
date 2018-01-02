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

/**
 * Comparator is used to compare two map entries in a distributed map.
 * A comparator class with the same functionality should be registered
 * on Hazelcast server in order to be used in {PagingPredicate}s.
 *
 */
export interface Comparator {
    /**
     * This method is used to determine order of entries when sorting.
     *  - If return value is a negative value, {a} comes after {b},
     *  - If return value is a positive value, {a} comes before {b},
     *  - If return value is 0, {a} and {b} are indistinguishable in this sorting mechanism.
     *      Their order with respect to each other is undefined.
     * This method must always return the same result given the same pair of keys.
     * @param a first entry
     * @param b second entry
     * @return order index
     *
     */
    sort(a: [any, any], b: [any, any]): number;
}
