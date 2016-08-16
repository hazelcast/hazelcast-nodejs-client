import * as Promise from 'bluebird';
import {DistributedObject} from '../DistributedObject';
import {OverflowPolicy} from '../core/OverflowPolicy';

export interface IRingbuffer<E> extends DistributedObject {

    /**
     * @return capacity of this ringbuffer.
     */
    capacity(): Promise<Long>;

    /**
     * Returns the number of the items in this ringbuffer.
     *
     * If time-to-live was NOT configured for this ringbuffer,
     * the size will always be equal to the capacity after the first loop is completed
     * around the ring. This is because no items are getting removed and are overwritten instead.
     *
     * @return size of this ringbuffer.
     */
    size(): Promise<Long>;

    /**
     * Returns the tail sequence. The tail is the side of the ringbuffer at which the items are added.
     *
     * The initial value of the tail sequence is -1.
     *
     * @return tail sequence of this ringbuffer.
     */
    tailSequence(): Promise<Long>;

    /**
     * Returns the head sequence. The head is the side of the ringbuffer where the oldest items are found.
     *
     * If the ringbuffer is empty, the head will be one more than the tail.
     *
     * The initial value of the head is 0.
     * @return head sequence of this ringbuffer.
     */
    headSequence(): Promise<Long>;

    /**
     * Returns the remaining capacity of this ringbuffer.
     *
     * The returned value could be stale as soon as it is returned.
     *
     * If the time-to-live was NOT set in the configuration,
     * the remaining capacity will always be equal to the capacity.
     * @return remaining capacity of this ringbuffer.
     */
    remainingCapacity(): Promise<Long>;


    /**
     * Adds an item to the tail of this ringbuffer. Overflow policy determines what will happen
     * if there is no space left in this ringbuffer. If `OVERWRITE` was passed,
     * the new item will overwrite the oldest one regardless of the configured time-to-live.
     *
     * In the case when FAIL was specified the add operation will keep failing until an oldest item in this
     * ringbuffer will reach its time-to-live.
     *
     * The returned value is the sequence number of the added item. You can read the added item using this number.
     *
     * @param item the item to add.
     * @param overflowPolicy overflow policy to be used
     * @return the sequence of the added item.
     */

    add(item: E, overflowPolicy: OverflowPolicy): Promise<Long>;

    /**
     * Adds all items in the specified array to the tail of this buffer. The behavior of this method is essentially
     * the same as the one of the `add` method.
     *
     * The method does not guarantee that the inserted items will have contiguous sequence numbers.
     * @param items items to be added
     * @param overflowPolicy overflow policy to be used
     * @return the sequence number of the last written item from the specified array
     */
    addAll(items: Array<E>, overflowPolicy: OverflowPolicy): Promise<Long>;


    /**
     * Reads a single item from this ringbuffer.
     *
     * If the sequence is equal to the current tail sequence plus one,
     * this call will not return a response until an item is added.
     * If it is more than that, an error will be thrown.
     *
     *
     * Unlike queue's `take`, this method does not remove an item from the ringbuffer. This means that the same item
     * can be read by multiple processes.
     *
     *
     * @param sequence the sequence number of the item to read.
     * @return the item that was read.
     * @throws Error                if the sequence is:
     *                              smaller then zero;
     *                              smaller than {@link #headSequence()};
     *                              more than {@link #tailSequence()} + 1
     */
    readOne(sequence: number | Long): Promise<E>;

    /**
     * Reads a batch of items from this ringbuffer.
     * If the number of available items starting at `sequence` is smaller than `maxCount`,
     * then this method will not wait for more items to arrive.
     * Instead, available items will be returned.
     *
     * If there are less items available than `minCount`, then this call will not return a response until
     * a necessary number of items becomes available.
     *
     * @param sequence sequence number of the first item to be read.
     * @param minCount minimum number of items to be read.
     * @param maxCount maximum number of items to be read.
     * @throws Error if startSequence is smaller than 0
     *               or if startSequence larger than {@link #tailSequence()}
     *               or if minCount smaller than 0
     *               or if minCount larger than maxCount,
     *               or if maxCount larger than the capacity of the ringbuffer
     *               or if maxCount larger than 1000 (to prevent overload)
     */
    readMany(sequence: number | Long, minCount: number, maxCount: number): Promise<Array<E>>;
}
