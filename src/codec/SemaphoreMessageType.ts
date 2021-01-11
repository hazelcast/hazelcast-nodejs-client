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
export class SemaphoreMessageType {
    static SEMAPHORE_INIT = 0x0d01;
    static SEMAPHORE_ACQUIRE = 0x0d02;
    static SEMAPHORE_AVAILABLEPERMITS = 0x0d03;
    static SEMAPHORE_DRAINPERMITS = 0x0d04;
    static SEMAPHORE_REDUCEPERMITS = 0x0d05;
    static SEMAPHORE_RELEASE = 0x0d06;
    static SEMAPHORE_TRYACQUIRE = 0x0d07;
}
