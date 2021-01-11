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

import {Member} from './Member';

/**
 * Item listener for IQueue, ISet, IList.
 */
export interface ItemListener<E> {
    itemAdded?: ItemEventListener<E>;
    itemRemoved?: ItemEventListener<E>;
}

/**
 * A type which is used for item events.
 */
export type ItemEventListener<E> = (itemEvent: ItemEvent<E>) => void;

/**
 * IQueue, ISet, IList item event.
 */
export class ItemEvent<E> {

    /**
     * The name of the data structure for this event.
     */
    name: string;

    /**
     * The value of the item event.
     */
    item: E;
    /**
     * The event type.
     */
    eventType: ItemEventType;

    /**
     * The member that fired this event.
     */
    member: Member;

    constructor(name: string, itemEventType: ItemEventType, item: E, member: Member) {
        this.name = name;
        this.eventType = itemEventType;
        this.item = item;
        this.member = member;
    }

}

export enum ItemEventType {
    ADDED = 1,
    REMOVED = 2,
}
