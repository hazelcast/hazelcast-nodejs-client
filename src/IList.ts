import {DistributedObject} from './DistributedObject';
import {ItemListener} from './core/ItemListener';
export interface IList<E> extends DistributedObject {
    /**
     * Appends the specified element at the end of the list.
     * @param element
     * @return `true` if this list has changed.
     */
    add(element: E): Promise<boolean>;

    /**
     * Inserts the specified element at specified index. Shifts the following
     * elements by one position.
     * @param index
     * @param element
     */
    addAt(index: number, element: E): Promise<void>;

    /**
     * Appends all specified elements at the end of this list.
     * @param elements
     * @return `true` if thi list changed.
     */
    addAll(elements: E[]): Promise<boolean>;

    /**
     * Inserts all elements at specified index. Shifts the following
     * elements by one position.
     * @param index
     * @param elements
     * @return `true` if thi list changed.
     */
    addAllAt(index: number, elements: E[]): Promise<boolean>;

    /**
     * Adds an item listener for this list.
     * Listener will be invoked for any add/remove item event.
     * @param listener
     * @param includeValue `true` if updated item should be included in the event.
     * @return registration id of the listener.
     */
    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string>;

    /**
     * Clears this list.
     */
    clear(): Promise<void>;

    /**
     * Checks if the list contains given element.
     * @param element
     * @return `true` if this list contains an element that equals to given element, `false` otherwise.
     */
    contains(element: E): Promise<boolean>;

    /**
     * Checks if the list contains given elements.
     * @param element
     * @return `true` if this list contains all of the given elements, `false` otherwise.
     * @param elements
     */
    containsAll(elements: E): Promise<boolean>;

    /**
     * Retrieves the element at given location.
     * @param index index of the element to return.
     * @return the element at that position.
     */
    get(index: number): Promise<E>;

    /**
     * Returns the index of first occurence of given element in the list.
     * @param element
     * @return the index of first occurence of given element or `-1` if the list does not contain given element.
     */
    indexOf(element: E): Promise<number>;

    /**
     * Checks if this list is empty.
     * @return `true` if this list contains no element, `false` otherwise.
     */
    isEmpty(): Promise<boolean>;

    /**
     * Returns the index number of last occurence of this element in the list.
     * @param element
     */
    lastIndexOf(element: E): Promise<number>;

    /**
     * Removes the given element from this list.
     * @param element
     * @return `true` if this list changed, `false` otherwise.
     */
    remove(element: E): Promise<boolean>;

    /**
     * Removes the element at given index.
     * @param index
     * @return the removed element.
     */
    removeAt(index: number): Promise<E>;

    /**
     * Removes given elements from the list.
     * @param elements
     * @return `true` if this list changed.
     */
    removeAll(elements: E[]): Promise<boolean>;

    /**
     * Removes an ItemListener from this list.
     * @param listenerId registration id of the listener to be removed.
     * @return `true` if the item listener is removed, `false` otherwise.
     */
    removeItemListener(listenerId: string): Promise<boolean>;

    /**
     * Removes all elements from this list except specified in `elements`.
     * @param elements
     * @return `true` if this list changed, `false` otherwise.
     */
    retainAll(elements: E[]): Promise<boolean>;

    /**
     * Replaces the element at the specified position in this list with the specified element.
     * @param index
     * @param element
     * @return previous element at given index.
     */
    set(index: number, element: E): Promise<void>;

    /**
     * Returns the number of elements in this list.
     */
    size(): number;

    /**
     * Return a view of this list that contain only elements between index numbers `from(inclusive)` to `to(exclusive)`
     * @param from
     * @param to
     */
    subList(from: number, to: number): Promise<E[]>;

    /**
     * Returns an array that contains all elements of this list in proper sequence.
     */
    toArray(): Promise<E[]>;
}
