import { ItemListener } from './ItemListener';
import { ReadOnlyLazyList } from '../core/ReadOnlyLazyList';
import { DistributedObject } from '../core/DistributedObject';
/**
 * Concurrent and distributed list.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
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
     * Appends all elements in the specified array to the end of this list, keeping the order of the array.
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
     * Removes all of the elements from this list.
     */
    clear(): Promise<void>;
    /**
     * Checks if the list contains the given element.
     * @param element
     * @return `true` if this list contains the specified element, `false` otherwise.
     */
    contains(element: E): Promise<boolean>;
    /**
     * Checks if the list contains all of the elements of the specified array.
     * @param elements - elements to be checked for presence in this list.
     * @return `true` if this list contains all of the elements of the specified array, `false` otherwise.
     */
    containsAll(elements: E[]): Promise<boolean>;
    /**
     * Returns the element at the specified position in this list.
     * @param index index of the element to return.
     */
    get(index: number): Promise<E>;
    /**
     * Returns the index of the first occurrence of the specified element in this list, or `-1` if this list does not contain
     * the element.
     * @param element element to search for
     */
    indexOf(element: E): Promise<number>;
    /**
     * Checks if this list is empty.
     * @return `true` if this list contains no elements, `false` otherwise.
     */
    isEmpty(): Promise<boolean>;
    /**
     * Returns the index of the last occurrence of the specified element in this list,
     * or -1 if this list does not contain the element.
     * @param element
     */
    lastIndexOf(element: E): Promise<number>;
    /**
     * Removes the first occurrence of the specified element from this list, if it is present.
     * @param element element to be removed
     * @return `true` if this list has changed as a result of this operation, `false` otherwise.
     */
    remove(element: E): Promise<boolean>;
    /**
     * Removes the element at the specified position in this list.
     * @param index index of the element to be removed.
     * @return the removed element.
     */
    removeAt(index: number): Promise<E>;
    /**
     * Removes from this list all of its elements that are contained in the specified array.
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
     * Retains only the elements in this list that are contained in the specified array.
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
     * Returns a view of this list that contains elements between index numbers from `start`
     * (inclusive) to `end` (exclusive)
     *
     * @param start start of the view
     * @param end end of the view
     * @return a view of the list
     */
    subList(start: number, end: number): Promise<ReadOnlyLazyList<E>>;
    /**
     * Returns an array that contains all elements of this list in proper sequence (from first to last element).
     */
    toArray(): Promise<E[]>;
}
