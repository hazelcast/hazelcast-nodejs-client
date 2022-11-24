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

import {MapEventListener} from './MapListener';
import {Member} from '../core';

/**
 * An interface which is used to get notified upon a map or an entry event.
 */
export interface EntryListener<K, V> {
    added?: EntryEventListener<K, V>;
    removed?: EntryEventListener<K, V>;
    updated?: EntryEventListener<K, V>;
    merged?: EntryEventListener<K, V>;
    evicted?: EntryEventListener<K, V>;
    expired?: EntryEventListener<K, V>;
    loaded?: EntryEventListener<K, V>;
    mapEvicted?: MapEventListener<K, V>;
    mapCleared?: MapEventListener<K, V>;

    [event: string]: EntryEventListener<K, V> | MapEventListener<K, V> | undefined;
}

/**
 * A type which is used for entry events.
 */
export type EntryEventListener<K, V> = (entryEvent: EntryEvent<K, V>) => void;

/**
 * Map Entry event.
 */
export class EntryEvent<K, V> {

    /**
     * The name of the map for this event.
     */
    name: string;

    /**
     * The key of the entry event.
     */
    key: K;

    /**
     * The value of the entry event.
     */
    value: V;

    /**
     * The old value of the entry event.
     */
    oldValue: V;

    /**
     * The incoming merging value of the entry event.
     */
    mergingValue: V;

    /**
     * The member that fired this event.
     */
    member: Member;

    constructor(name: string, key: K, value: V, oldValue: V, mergingValue: V, member: Member) {
        this.name = name;
        this.key = key;
        this.value = value;
        this.oldValue = oldValue;
        this.mergingValue = mergingValue;
        this.member = member;
    }
}
