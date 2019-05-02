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
export class MultiMapMessageType {
    static MULTIMAP_PUT = 0x0201;
    static MULTIMAP_GET = 0x0202;
    static MULTIMAP_REMOVE = 0x0203;
    static MULTIMAP_KEYSET = 0x0204;
    static MULTIMAP_VALUES = 0x0205;
    static MULTIMAP_ENTRYSET = 0x0206;
    static MULTIMAP_CONTAINSKEY = 0x0207;
    static MULTIMAP_CONTAINSVALUE = 0x0208;
    static MULTIMAP_CONTAINSENTRY = 0x0209;
    static MULTIMAP_SIZE = 0x020a;
    static MULTIMAP_CLEAR = 0x020b;
    static MULTIMAP_VALUECOUNT = 0x020c;
    static MULTIMAP_ADDENTRYLISTENERTOKEY = 0x020d;
    static MULTIMAP_ADDENTRYLISTENER = 0x020e;
    static MULTIMAP_REMOVEENTRYLISTENER = 0x020f;
    static MULTIMAP_LOCK = 0x0210;
    static MULTIMAP_TRYLOCK = 0x0211;
    static MULTIMAP_ISLOCKED = 0x0212;
    static MULTIMAP_UNLOCK = 0x0213;
    static MULTIMAP_FORCEUNLOCK = 0x0214;
    static MULTIMAP_REMOVEENTRY = 0x0215;
}
