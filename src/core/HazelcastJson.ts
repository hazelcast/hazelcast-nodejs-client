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
 * HazelcastJson is a wrapper for JSON formatted strings. It is preferred
 * to store HazelcastJson instead of Strings for JSON formatted strings.
 * Users can run predicates and use indexes on the attributes of the underlying
 * JSON strings.
 *
 * HazelcastJson is queried using Hazelcast's querying language.
 * See {@link Predicates}.
 *
 * In terms of querying, numbers in JSON strings are treated as either
 * Long or Double in the Java side. Strings, booleans and null
 * are treated as their Java counterparts.
 *
 * HazelcastJson keeps given string as it is.
 *
 * This class does not validate the underlying JSON string.
 * Invalid JSON strings may cause wrong results in queries.
 */
export class HazelcastJson {

    private readonly jsonString: string;

    constructor(jsonString: string) {
        this.jsonString = jsonString;
    }

    toJsonString(): string {
        return this.jsonString;
    }

    parse(): any {
        return JSON.parse(this.jsonString);
    }
}
