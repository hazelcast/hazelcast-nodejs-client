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

/* tslint:disable */
export class AtomicLongMessageType {
    static ATOMICLONG_APPLY = 0x0a01;
    static ATOMICLONG_ALTER = 0x0a02;
    static ATOMICLONG_ALTERANDGET = 0x0a03;
    static ATOMICLONG_GETANDALTER = 0x0a04;
    static ATOMICLONG_ADDANDGET = 0x0a05;
    static ATOMICLONG_COMPAREANDSET = 0x0a06;
    static ATOMICLONG_DECREMENTANDGET = 0x0a07;
    static ATOMICLONG_GET = 0x0a08;
    static ATOMICLONG_GETANDADD = 0x0a09;
    static ATOMICLONG_GETANDSET = 0x0a0a;
    static ATOMICLONG_INCREMENTANDGET = 0x0a0b;
    static ATOMICLONG_GETANDINCREMENT = 0x0a0c;
    static ATOMICLONG_SET = 0x0a0d;
}
