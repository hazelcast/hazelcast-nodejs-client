import * as Long from 'long';
import { DistributedObject, ReadResultSet } from '../core';
import { OverflowPolicy } from './OverflowPolicy';
/**
 * A Ringbuffer is a data structure where the content is stored in a ring-like
 * structure. A ringbuffer has a fixed capacity, so it won't grow beyond
 * that capacity and endanger the stability of the system. If that capacity
 * is exceeded, the oldest item in the ringbuffer is overwritten.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
export interface Ringbuffer<E> extends DistributedObject {
    /**
     * @return capacity of this Ringbuffer
     */
    capacity(): Promise<Long>;
    /**
     * Returns the number of the items in this Ringbuffer.
     *
     * If time-to-live was not configured for this ringbuffer, the size will
     * always be equal to the capacity after the first loop is completed around
     * the ring. This is because no items are getting removed and are
     * overwritten instead.
     *
     * @return size of this Ringbuffer
     */
    size(): Promise<Long>;
    /**
     * Returns the tail sequence. The tail is the side of the Ringbuffer
     * at which the items are added.
     *
     * The initial value of the tail sequence is `-1`.
     *
     * @return tail sequence of this Ringbuffer
     */
    tailSequence(): Promise<Long>;
    /**
     * Returns the head sequence. The head is the side of the ringbuffer
     * where the oldest items are found.
     *
     * If the ringbuffer is empty, the head will be one more than the tail.
     *
     * The initial value of the head is `0`.
     *
     * @return head sequence of this Ringbuffer
     */
    headSequence(): Promise<Long>;
    /**
     * Returns the remaining capacity of this ringbuffer.
     *
     * The returned value could be stale as soon as it is returned.
     *
     * If the time-to-live was NOT set in the configuration,
     * the remaining capacity will always be equal to the capacity.
     *
     * @return remaining capacity of this Ringbuffer
     */
    remainingCapacity(): Promise<Long>;
    /**
     * Adds an item to the tail of this Ringbuffer. Overflow policy determines
     * what will happen if there is no space left in this ringbuffer.
     * If `OVERWRITE` was passed, the new item will overwrite the oldest one
     * regardless of the configured time-to-live.
     *
     * In the case when `FAIL` was specified the add operation will keep failing
     * until the oldest item in this Ringbuffer will reach its time-to-live.
     *
     * The returned value is the sequence number of the added item. You can
     * read the added item using this number.
     *
     * @param item the item to add
     * @param overflowPolicy overflow policy to be used
     * @return the sequence of the added item or `-1` if the insert did not succeed
     */
    add(item: E, overflowPolicy?: OverflowPolicy): Promise<Long>;
    /**
     * Adds all items in the specified array to the tail of this Ringbuffer.
     * The behavior of this method is essentially the same as the one of
     * the `add` method.
     *
     * The method does not guarantee that the inserted items will have
     * contiguous sequence numbers.
     *
     * @param items items to be added
     * @param overflowPolicy overflow policy to be used
     * @return the sequence number of the last written item from the specified array
     */
    addAll(items: E[], overflowPolicy?: OverflowPolicy): Promise<Long>;
    /**
     * Reads a single item from this Ringbuffer.
     *
     * If the sequence is equal to the current tail sequence plus one,
     * this call will not return a response until an item is added.
     * If it is more than that, an error will be thrown.
     *
     * Unlike queue's `take`, this method does not remove an item from the
     * Ringbuffer. This means that the same item can be read by multiple
     * processes.
     *
     * @param sequence the sequence number of the item to read
     * @return the item that was read
     * @throws RangeError if `sequence` is:
     *                      smaller than `0`,
     *                      or smaller than `headSequence`,
     *                      or greater than `tailSequence + 1`
     */
    readOne(sequence: number | Long): Promise<E>;
    /**
     * Reads a batch of items from the Ringbuffer. If the number of available
     * items starting at `sequence` is smaller than `maxCount`, then this
     * method will not wait for more items to arrive. Instead, available
     * items will be returned.
     *
     * If there are fewer items available than `minCount`, then this call will
     * not return a response until a necessary number of items becomes available.
     *
     * If `startSequence` is smaller than the smallest sequence still available
     * in the Ringbuffer `headSequence`, then the smallest available
     * sequence will be used as the start sequence, and the minimum/maximum
     * number of items will be attempted to be read from there on.
     *
     * If `startSequence` is bigger than the last available sequence in the
     * Ringbuffer `tailSequence`, then the last available sequence
     * plus one will be used as the start sequence, and the call will block
     * until further items become available, and it can read at least the
     * minimum number of items.
     *
     * `filter` argument is provided to select only the items that are needed
     * to be read. If the filter is not provided, all items will be read.
     * Otherwise, only the items where the filter function returns true are returned.
     * Using filters is a good way to prevent getting items that are of no value
     * to the receiver. This reduces the amount of IO and the number of operations being executed,
     * and can result in a significant performance improvement. Note that,
     * filtering logic must be defined on the server-side.
     *
     * @param startSequence sequence number of the first item to be read.
     * @param minCount minimum number of items to be read.
     * @param maxCount maximum number of items to be read.
     * @param filter optional filter to be applied to the items
     * @throws RangeError if `startSequence` is smaller than `0`,
     *                      or if `minCount` smaller than `0`,
     *                      or if `minCount` larger than `maxCount`,
     *                      or if `maxCount` larger than `1000` (to prevent overloading)
     */
    readMany(startSequence: number | Long, minCount: number, maxCount: number, filter?: any): Promise<ReadResultSet<E>>;
}
