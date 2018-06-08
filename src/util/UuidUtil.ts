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
import * as Long from 'long';
import {UUID} from '../core/UUID';

const INT_BOUND = 0xFFFFFFFF;

function randomUInt(): number {
    return Math.floor(Math.random() * INT_BOUND);
}

export class UuidUtil {
    static generate(): UUID {
        const mostS = new Long(randomUInt(), randomUInt(), true);
        const leastS = new Long(randomUInt(), randomUInt(), true);
        return new UUID(mostS, leastS);
    }
}
