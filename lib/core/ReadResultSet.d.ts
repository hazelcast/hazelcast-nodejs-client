import * as Long from 'long';
export declare const SEQUENCE_UNAVAILABLE = -1;
/**
 * Defines the result of a {@link Ringbuffer.readMany} operation.
 */
export interface ReadResultSet<T> {
    /**
     * Returns the number of items that have been read before filtering.
     *
     * If no filter is set, then the readCount will be equal to `size`.
     * However, if a filter is applied, it could be that items are read, but are
     * filtered out. So if you are trying to make another read based on the
     * ReadResultSet then you should increment the sequence by readCount and
     * not by size. Otherwise, you will be re-reading the same filtered messages.
     *
     * @returns the number of items read (including the filtered ones).
     */
    getReadCount(): number;
    /**
     * Gets the item at the given index.
     *
     * @param index
     * @throws {@link HazelcastSerializationError} if the object to be returned is a compact object whose schema is not known
     * @returns the found item or `undefined` if the index is out of bounds
     */
    get(index: number): T;
    /**
     * Returns the sequence number for the item at the given index.
     *
     * @param index
     * @returns the sequence number for the ringbuffer item
     *          or `undefined` if the index is out of bounds.
     */
    getSequence(index: number): Long;
    /**
     * Returns the result set size.
     *
     * @returns the result set size
     */
    size(): number;
    /**
    * Returns an iterator for elements in the list.
    *
    * @returns the iterator for elements in the list.
    */
    [Symbol.iterator](): Iterator<T>;
    /**
     * Returns the sequence of the item following the last read item. This
     * sequence can then be used to read items following the ones returned by
     * this result set.
     *
     * Usually this sequence is equal to the sequence used to retrieve this
     * result set incremented by the {@link getReadCount}. In cases when the
     * reader tolerates lost items, this is not the case.
     *
     * For instance, if the reader requests an item with a stale sequence (one
     * which has already been overwritten), the read will jump to the oldest
     * sequence and read from there.
     *
     * Similarly, if the reader requests an item in the future (e.g. because
     * the partition was lost, and the reader was unaware of this), the read
     * method will jump back to the newest available sequence.
     * Because of these jumps and only in the case when the reader is loss
     * tolerant, the next sequence must be retrieved using this method.
     * A return value of `SEQUENCE_UNAVAILABLE` (`-1`) means that the
     * information is not available.
     *
     * @returns the sequence of the item following the last item in the result set
     */
    getNextSequenceToReadFrom(): Long;
}
