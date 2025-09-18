import { DistributedObject } from '../core';
/**
 * A distributed, highly available object reference with atomic operations.
 *
 * IAtomicReference offers linearizability during crash failures and network
 * partitions. It is CP with respect to the CAP principle. If a network
 * partition occurs, it remains available on at most one side of the partition.
 *
 * The following are some considerations you need to know when you use IAtomicReference:
 * <ul>
 * <li>
 * IAtomicReference works based on the byte-content and not on the object-reference.
 * If you use the `compareAndSet()` method, do not change to the original value because
 * its serialized content will then be different.
 * </li>
 * <li>
 * All methods returning an object return a private copy. You can modify the private
 * copy, but the rest of the world is shielded from your changes. If you want these
 * changes to be visible to the rest of the world, you need to write the change back
 * to the `IAtomicReference`; but be careful about introducing a data-race.
 * </li>
 * <li>
 * The 'in-memory format' of an `IAtomicReference` is `binary`. The receiving side
 * does not need to have the class definition available unless it needs to be
 * deserialized on the other side., e.g., because a method like `alter()` is executed.
 * This deserialization is done for every call that needs to have the object instead
 * of the binary content, so be careful with expensive object graphs that need to be
 * deserialized.
 * </li>
 * <li>
 * If you have an object with many fields or an object graph, and you only need to
 * calculate some information or need a subset of fields, you can use the `apply()`
 * method. With the `apply()` method, the whole object does not need to be sent over
 * the line; only the information that is relevant is sent.
 * </li>
 * </ul>
 *
 * `IFunction`-based methods, like `alter()` or `apply()` are not yet supported by
 * Hazelcast Node.js client.
 *
 * IAtomicReference does not offer exactly-once / effectively-once
 * execution semantics. It goes with at-least-once execution semantics
 * by default and can cause an API call to be committed multiple times
 * in case of CP member failures. It can be tuned to offer at-most-once
 * execution semantics. Please see `fail-on-indeterminate-operation-state`
 * server-side setting.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
export interface IAtomicReference<E> extends DistributedObject {
    /**
     * Atomically sets the value to the given updated value
     * only if the current value is equal to the expected value.
     *
     * @param expect the expected value
     * @param update the new value
     * @returns `true` if successful, or `false` if the actual value
     *          was not equal to the expected value
     */
    compareAndSet(expect: E, update: E): Promise<boolean>;
    /**
     * Gets the current value.
     *
     * @returns the current value
     */
    get(): Promise<E>;
    /**
     * Atomically sets the given value.
     *
     * @param newValue the new value
     */
    set(newValue: E): Promise<void>;
    /**
     * Gets the old value and sets the new value.
     *
     * @param newValue the new value
     * @returns the old value
     */
    getAndSet(newValue: E): Promise<E>;
    /**
     * Checks if the stored reference is `null`.
     *
     * @returns `true` if `null`, `false` otherwise
     */
    isNull(): Promise<boolean>;
    /**
     * Clears the current stored reference, so it becomes a `null`.
     */
    clear(): Promise<void>;
    /**
     * Checks if the reference contains the value.
     *
     * @param value the value to check (is allowed to be `null`)
     * @returns `true` if the value is found, `false` otherwise
     */
    contains(value: E): Promise<boolean>;
}
