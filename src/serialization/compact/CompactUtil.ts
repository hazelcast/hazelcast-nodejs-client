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

import {HazelcastSerializationError} from '../../core';

/**
 * Compact exception util
 * @internal
 */
export class CompactExceptions {
    static toExceptionForUnexpectedNullValue(fieldName: string, methodSuffix: string): HazelcastSerializationError {
        return new HazelcastSerializationError(
            `Error while reading ${fieldName}. null value can not be read via` +
            `get${methodSuffix} methods. Use getNullable${methodSuffix} instead.`
        );
    }

    static toExceptionForUnexpectedNullValueInArray(fieldName: string, methodSuffix: string): HazelcastSerializationError {
        return new HazelcastSerializationError(
            `Error while reading ${fieldName}. null value can not be read via` +
            `getArrayOf${methodSuffix} methods. Use getArrayOf${methodSuffix} instead.`
        );
    }
}
