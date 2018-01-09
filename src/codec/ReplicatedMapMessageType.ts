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

/* tslint:disable */
export class ReplicatedMapMessageType {
    static REPLICATEDMAP_PUT = 0x0e01;
    static REPLICATEDMAP_SIZE = 0x0e02;
    static REPLICATEDMAP_ISEMPTY = 0x0e03;
    static REPLICATEDMAP_CONTAINSKEY = 0x0e04;
    static REPLICATEDMAP_CONTAINSVALUE = 0x0e05;
    static REPLICATEDMAP_GET = 0x0e06;
    static REPLICATEDMAP_REMOVE = 0x0e07;
    static REPLICATEDMAP_PUTALL = 0x0e08;
    static REPLICATEDMAP_CLEAR = 0x0e09;
    static REPLICATEDMAP_ADDENTRYLISTENERTOKEYWITHPREDICATE = 0x0e0a;
    static REPLICATEDMAP_ADDENTRYLISTENERWITHPREDICATE = 0x0e0b;
    static REPLICATEDMAP_ADDENTRYLISTENERTOKEY = 0x0e0c;
    static REPLICATEDMAP_ADDENTRYLISTENER = 0x0e0d;
    static REPLICATEDMAP_REMOVEENTRYLISTENER = 0x0e0e;
    static REPLICATEDMAP_KEYSET = 0x0e0f;
    static REPLICATEDMAP_VALUES = 0x0e10;
    static REPLICATEDMAP_ENTRYSET = 0x0e11;
    static REPLICATEDMAP_ADDNEARCACHEENTRYLISTENER = 0x0e12;
}
