import Promise = Q.Promise;
export interface SetInterface<E> {
    /**
     * Adds the specified element to this set if not already present.
     * @param entry
     * @throws {Error} if entry is null or undefined.
     * @return a promise to be resolved to true if this set did not contain the element.
     */
    add(entry : E) : Promise<boolean>;

    /**
     * Adds the elements contained in collection to this set if not already present.
     * Set contains all elements of collection and its previous elements at the end.
     * @param collection
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return true if this set changed, false otherwise.
     */
    addAll(collection : any) : Promise<boolean>;

    /**
     * Removes all of the elements from this set.
     */
    clear() : Promise<void>;

    /**
     * Checks whether this set contains given element.
     * @param entry
     * @throws {Error} if entry is null.
     * @return true if this set contains given element, false otherwise.
     */
    contains(entry : E) : Promise<boolean>;

    /**
     * Checks whether this set contains all elements of given collection.
     * @param collection
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return true if this set contains all elments of given collection, false otherwise.
     */
    containsAll(collection : any) :  Promise<boolean>;

    /**
     * Checks if this set has any elements.
     * @return true if this set does not have any elements, false otherwise.
     */
    isEmpty() : Promise<boolean>;

    /**
     * Removes given entry from this set.
     * @param entry
     * @throws {Error} if entry is null or undefined.
     * @return true if this set actually had given element, false otherwise.
     */
    remove(entry : E) : Promise<boolean>;

    /**
     * Checks all elements of given collection from this set.
     * @param collection
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return true if this set changed.
     */
    removeAll(collection : any) : Promise<boolean>;

    /**
     * Removes all elements from this set except the elements of given collection.
     * @param collection
     * @throws {Error} if collection or one of its elements is null or undefined.
     * @return true if this set changed.
     */
    retainAll(collection : any) : Promise<boolean>;

    /**
     * Returns the size of this set.
     * @return number of elements in this set.
     */
    size() : Promise<number>;
}
