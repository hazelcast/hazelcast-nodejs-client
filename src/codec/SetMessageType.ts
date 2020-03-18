/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
export class SetMessageType {
    static SET_SIZE = 0x0601;
    static SET_CONTAINS = 0x0602;
    static SET_CONTAINSALL = 0x0603;
    static SET_ADD = 0x0604;
    static SET_REMOVE = 0x0605;
    static SET_ADDALL = 0x0606;
    static SET_COMPAREANDREMOVEALL = 0x0607;
    static SET_COMPAREANDRETAINALL = 0x0608;
    static SET_CLEAR = 0x0609;
    static SET_GETALL = 0x060a;
    static SET_ADDLISTENER = 0x060b;
    static SET_REMOVELISTENER = 0x060c;
    static SET_ISEMPTY = 0x060d;
}
