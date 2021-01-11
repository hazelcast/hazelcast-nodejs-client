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

import {EntryListener} from './EntryListener';
import {Member} from './Member';

/**
 * An interface which is used to get notified upon a map or an entry event.
 */
export interface MapListener<K, V> extends EntryListener<K, V> {
}

/**
 * A type which is used for map events.
 */
export type MapEventListener<K, V> = (mapEvent: MapEvent) => void;

/**
 * Used for map-wide events.
 */
export class MapEvent {

    /**
     * The name of the map for this event.
     */
    name: string;
    /**
     * Number of entries affected by this event.
     */
    numberOfAffectedEntries: number;

    /**
     * The member that fired this event.
     */
    member: Member;

    constructor(name: string, numberOfAffectedEntries: number, member: Member) {
        this.name = name;
        this.numberOfAffectedEntries = numberOfAffectedEntries;
        this.member = member;
    }
}
