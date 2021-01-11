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

/* tslint:disable */
export class LockMessageType {
    static LOCK_ISLOCKED = 0x0701;
    static LOCK_ISLOCKEDBYCURRENTTHREAD = 0x0702;
    static LOCK_GETLOCKCOUNT = 0x0703;
    static LOCK_GETREMAININGLEASETIME = 0x0704;
    static LOCK_LOCK = 0x0705;
    static LOCK_UNLOCK = 0x0706;
    static LOCK_FORCEUNLOCK = 0x0707;
    static LOCK_TRYLOCK = 0x0708;
}
