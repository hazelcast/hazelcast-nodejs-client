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
/** @ignore *//** */

/** @internal */
export class SerializationSymbols {
    static readonly BYTE_SYMBOL = Symbol();
    static readonly NULL_SYMBOL = Symbol();
    static readonly SHORT_SYMBOL = Symbol();
    static readonly INTEGER_SYMBOL = Symbol();
    static readonly LONG_SYMBOL = Symbol();
    static readonly FLOAT_SYMBOL = Symbol();
    static readonly CHAR_SYMBOL = Symbol();
    static readonly DATE_SYMBOL = Symbol();
    static readonly LOCALDATE_SYMBOL = Symbol();
    static readonly LOCALTIME_SYMBOL = Symbol();
    static readonly LOCALDATETIME_SYMBOL = Symbol();
    static readonly OFFSETDATETIME_SYMBOL = Symbol();
    static readonly JAVACLASS_SYMBOL = Symbol();
    static readonly ARRAYLIST_SYMBOL = Symbol();
    static readonly LINKLIST_SYMBOL = Symbol();
    static readonly UUID_SYMBOL = Symbol();
    static readonly BIGDECIMAL_SYMBOL = Symbol();
    static readonly JAVA_ARRAY_SYMBOL = Symbol();
    static readonly COMPACT_SYMBOL = Symbol();
    static readonly IDENTIFIED_SYMBOL = Symbol();
    static readonly PORTABLE_SYMBOL = Symbol();
    static readonly JSON_SYMBOL = Symbol();
    static readonly GLOBAL_SYMBOL = Symbol();
}

// eslint-disable-next-line @typescript-eslint/ban-types 
export function getTypes(clazz: Function | Symbol): Function | Symbol {
    if (typeof clazz == 'symbol') {
        return clazz;
    }
    if (typeof clazz == 'string') {
        return String.prototype.constructor;
    }
    if (typeof clazz == 'number') {
        return Number.prototype.constructor;
    }
    if (typeof clazz == 'boolean') {
        return Boolean.prototype.constructor;
    }
    if (typeof clazz == 'bigint') {
        return BigInt.prototype.constructor;
    }
    
}