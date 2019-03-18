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

import {assertNotNull} from '../Util';

/**
 * HazelcastJsonValue is a wrapper for JSON formatted strings. It is preferred
 * to store HazelcastJsonValue instead of Strings for JSON formatted strings.
 * Users can run predicates and use indexes on the attributes of the underlying
 * JSON strings.
 *
 * HazelcastJsonValue is queried using Hazelcast's querying language.
 * See {@link Predicate}.
 *
 * In terms of querying, numbers in JSON strings are treated as either
 * Long or Double in the Java side. Strings, booleans and null
 * are treated as their Java counterparts.
 *
 * HazelcastJsonValue keeps given string as it is. Strings are not
 * checked for being valid. Ill-formatted json strings may cause false
 * positive or false negative results in queries.
 *
 * HazelcastJsonValue can also be constructed from an object. In that case,
 * objects are converted to JSON strings and stored as such.
 *
 * Null values are not allowed.
 */
export class HazelcastJsonValue {

    private readonly jsonString: string;

    /**
     * Creates a HazelcastJsonValue from given string or object.
     * @param value a non null Json string or JavaScript object
     */
    constructor(value: any) {
        assertNotNull(value);
        if (typeof value === 'string') {
            this.jsonString = value;
        } else {
            this.jsonString = JSON.stringify(value);
        }
    }

    /**
     * Returns unaltered string that was used to create this object.
     * @return original string
     */
    toString(): string {
        return this.jsonString;
    }
}
