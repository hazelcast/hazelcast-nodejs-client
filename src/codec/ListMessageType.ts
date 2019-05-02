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
export class ListMessageType {
    static LIST_SIZE = 0x0501;
    static LIST_CONTAINS = 0x0502;
    static LIST_CONTAINSALL = 0x0503;
    static LIST_ADD = 0x0504;
    static LIST_REMOVE = 0x0505;
    static LIST_ADDALL = 0x0506;
    static LIST_COMPAREANDREMOVEALL = 0x0507;
    static LIST_COMPAREANDRETAINALL = 0x0508;
    static LIST_CLEAR = 0x0509;
    static LIST_GETALL = 0x050a;
    static LIST_ADDLISTENER = 0x050b;
    static LIST_REMOVELISTENER = 0x050c;
    static LIST_ISEMPTY = 0x050d;
    static LIST_ADDALLWITHINDEX = 0x050e;
    static LIST_GET = 0x050f;
    static LIST_SET = 0x0510;
    static LIST_ADDWITHINDEX = 0x0511;
    static LIST_REMOVEWITHINDEX = 0x0512;
    static LIST_LASTINDEXOF = 0x0513;
    static LIST_INDEXOF = 0x0514;
    static LIST_SUB = 0x0515;
    static LIST_ITERATOR = 0x0516;
    static LIST_LISTITERATOR = 0x0517;
}
