import { ItemListener } from './ItemListener';
import { DistributedObject } from '../core';
/**
 * Concurrent and distributed set.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
export interface ISet<E> extends DistributedObject {
    /**
     * Adds the specified element to this set if not already present.
     * @param entry
     * @return a promise to be resolved to true if this set did not contain the element.
     */
    add(entry: E): Promise<boolean>;
    /**
     * Adds the elements in the array `items` to this set if not already present.
     * At the end, the set contains all elements of `items` array and its previous elements.
     * @param items
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
     * Checks whether this set contains the given element.
     * @param entry
     * @return true if this set contains the given element, false otherwise.
     */
    contains(entry: E): Promise<boolean>;
    /**
     * Checks whether this set contains all elements of given array.
     * @param items
     * @return `tru`e if this set contains all elements of given collection, `false` otherwise.
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
     * @return true if this set actually had given element, false otherwise.
     */
    remove(entry: E): Promise<boolean>;
    /**
     * Removes all elements of given array from this set.
     * @param items
     * @return `true` if this set changed.
     */
    removeAll(items: E[]): Promise<boolean>;
    /**
     * Removes all elements from this set except the elements of given array.
     * @param items
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
     * Listener will be invoked for any add/remove item events.
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
