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

import * as Promise from 'bluebird';
import {ItemListener} from '../core/ItemListener';
import {DistributedObject} from '../DistributedObject';

export interface ISet<E> extends DistributedObject {
    /**
     * Adds the specified element to this set if not already present.
     * @param entry
     * @throws {Error} if entry is null or undefined.
     * @return a promise to be resolved to true if this set did not contain the element.
     */
    add(entry: E): Promise<boolean>;

    /**
     * Adds the elements contained in array to this set if not already present.
     * Set contains all elements of items array and its previous elements at the end.
     * @param items
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return true if this set changed, false otherwise.
     */
    addAll(items: E[]): Promise<boolean>;

    /**
     * Returns an array containing all of the elements in the set.
     * @return An array of items.
     */
    toArray(): Promise<E[]>;

    /**
     * Removes all of the elements from this set.
     */
    clear(): Promise<void>;

    /**
     * Checks whether this set contains given element.
     * @param entry
     * @throws {Error} if entry is null.
     * @return true if this set contains given element, false otherwise.
     */
    contains(entry: E): Promise<boolean>;

    /**
     * Checks whether this set contains all elements of given array.
     * @param items
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return `tru`e if this set contains all elments of given collection, `false` otherwise.
     */
    containsAll(items: E[]): Promise<boolean>;

    /**
     * @return true if this set does n
     * Checks if this set has any elements.ot have any elements, false otherwise.
     */
    isEmpty(): Promise<boolean>;

    /**
     * Removes given entry from this set.
     * @param entry
     * @throws {Error} if entry is null or undefined.
     * @return true if this set actually had given element, false otherwise.
     */
    remove(entry: E): Promise<boolean>;

    /**
     * Removes all elements of given array from this set.
     * @param items
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return `true` if this set changed.
     */
    removeAll(items: E[]): Promise<boolean>;

    /**
     * Removes all elements from this set except the elements of given array.
     * @param items
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return `true` if this set changed.
     */
    retainAll(items: E[]): Promise<boolean>;

    /**
     * Returns the size of this set.
     * @return number of elements in this set.
     */
    size(): Promise<number>;

    /**
     * Adds an item listener for this set.
     * Listener will be invoked for any add/remove item event.
     * @param listener
     * @param includeValue `true` if updated item should be included in the event.
     * @return Registration id of the listener.
     */
    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string>;

    /**
     * Removes an item listener for this set.
     * @param registrationId Registration id of the listener to be removed.
     * @return `true` if the item listener is removed, `false` otherwise.
     */
    removeItemListener(registrationId: string): Promise<boolean>;
}
