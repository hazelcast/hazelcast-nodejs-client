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

import * as Promise from '../PromiseWrapper';
import {DistributedObject} from '../DistributedObject';
import {ItemListener} from '../core/ItemListener';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';

export interface IList<E> extends DistributedObject {

    /**
     * Appends the specified element to the end of the list.
     * @param element - element to be added
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    add(element: E): Promise<boolean>;

    /**
     * Inserts the specified element at the specified index.
     * Shifts the subsequent elements to the right.
     * @param index position at which the element should be inserted
     * @param element element to be inserted
     */
    addAt(index: number, element: E): Promise<void>;

    /**
     * Appends all elements in the specified array to the end of this list,
     * @param elements array to be appended
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    addAll(elements: E[]): Promise<boolean>;

    /**
     * Inserts all elements in the specified array at specified index, keeping the order of the array.
     * Shifts the subsequent elements to the right.
     * @param index position at which the array's elements should be inserted
     * @param elements array to be inserted
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    addAllAt(index: number, elements: E[]): Promise<boolean>;

    /**
     * Adds an item listener for this list.
     * Listener will be invoked whenever an item is added to or removed from this list.
     * @param listener object with listener functions
     * @param includeValue `true` if updated item should be included in the event.
     * @return registration ID of the listener.
     */
    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string>;

    /**
     * Clears this list.
     */
    clear(): Promise<void>;

    /**
     * Checks if the list contains given element.
     * @param element
     * @return `true` if this list contains an element that is equal the to given element, `false` otherwise.
     */
    contains(element: E): Promise<boolean>;

    /**
     * Checks if the list contains all of the given elements.
     * @param elements - elements to be checked for presence in this list.
     * @return `true` if this list contains all of the given elements, `false` otherwise.
     */
    containsAll(elements: E[]): Promise<boolean>;

    /**
     * Retrieves the element at given location.
     * @param index index of the element to return.
     * @return the element at that position.
     */
    get(index: number): Promise<E>;

    /**
     * Returns the position of first occurrence of the given element in this list.
     * @param element element to search for
     * @return the index of first occurrence of given element or `-1` if the list does not contain given element.
     */
    indexOf(element: E): Promise<number>;

    /**
     * Checks if this list is empty.
     * @return `true` if this list contains no elements, `false` otherwise.
     */
    isEmpty(): Promise<boolean>;

    /**
     * Returns position of the last occurrence of the given element in this list.
     * @param element
     */
    lastIndexOf(element: E): Promise<number>;

    /**
     * Removes the given element from this list.
     * @param element element to be removed
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    remove(element: E): Promise<boolean>;

    /**
     * Removes the element at the given index.
     * @param index index of the element to be removed.
     * @return the removed element.
     */
    removeAt(index: number): Promise<E>;

    /**
     * Removes given elements from the list.
     * @param elements elements to be removed
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    removeAll(elements: E[]): Promise<boolean>;

    /**
     * Removes an ItemListener from this list.
     * @param listenerId registration ID of the listener to be removed.
     * @return `true` if the item listener was successfully removed, `false` otherwise.
     */
    removeItemListener(listenerId: string): Promise<boolean>;

    /**
     * Removes all elements from this list except the ones contained in the given array.
     * @param elements elements to retain
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    retainAll(elements: E[]): Promise<boolean>;

    /**
     * Replaces the element at the specified position in this list with the specified element.
     * @param index position of the element to be replaced
     * @param element replacement element
     * @return previous element at the given index.
     */
    set(index: number, element: E): Promise<E>;

    /**
     * Returns the number of elements in this list.
     */
    size(): Promise<number>;

    /**
     * Return a view of this list that contains elements between index numbers from `start` (inclusive) to `end` (exclusive)
     * @param start start of the view
     * @param end end of the view
     * @return a view of this list that contains elements between index numbers from `start` (inclusive) to `end` (exclusive)
     */
    subList(start: number, end: number): Promise<ReadOnlyLazyList<E>>;

    /**
     * Returns an array that contains all elements of this list in proper sequence.
     */
    toArray(): Promise<E[]>;
}
