/**
 * Overflow policy for Ringbuffer and Reliable Topic operations.
 */
export declare enum OverflowPolicy {
    /**
     * The new item will overwrite the oldest one regardless of the
     * configured time-to-live.
     */
    OVERWRITE = "OVERWRITE",
    /**
     * Add operations will keep failing until the oldest item in this
     * ringbuffer will reach its time-to-live.
     */
    FAIL = "FAIL"
}
