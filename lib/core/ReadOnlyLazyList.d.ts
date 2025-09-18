/**
 * Represents a list of values with lazy deserialization. Iterating over this list and some of its methods will
 * throw {@link HazelcastSerializationError} in case a compact object is read and its schema is not known by the client.
 */
export declare class ReadOnlyLazyList<T> {
    private readonly internalArray;
    private readonly serializationService;
    /**
     * Returns list's element at the specified index.
     *
     * @param index element's index
     * @throws {@link HazelcastSerializationError} if the object to be returned is a compact object whose schema is not known
     * @returns element
     */
    get(index: number): T;
    /**
     * Returns the size of the list.
     */
    size(): number;
    /**
     * Returns an iterator for elements in the list.
     */
    values(): Iterator<T>;
    /**
     * Returns a slice of the list.
     *
     * @param start The beginning of the specified portion of the list (inclusive).
     * @param end The end of the specified portion of the list (exclusive).
     */
    slice(start: number, end?: number): ReadOnlyLazyList<T>;
    /**
     * Returns an array that contains all elements of this list in proper sequence.
     * @throws {@link HazelcastSerializationError} if the list includes a compact object whose schema is not known
     */
    toArray(): T[];
    [Symbol.iterator](): Iterator<T>;
}
