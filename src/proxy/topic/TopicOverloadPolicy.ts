export enum TopicOverloadPolicy {
    /**
     * Using this policy, a message that has not expired can be overwritten.
     * No matter the retention period set, the overwrite will just overwrite the item.
     *
     * This can be a problem for slow consumers because they were promised a certain time window to process messages.
     * But it will benefit producers and fast consumers since they are able to continue.
     * This policy sacrifices the slow producer in favor of fast producers/consumers.
     */
    DISCARD_OLDEST,

    /**
     * The message that was to be published, is discarded.
     */
    DISCARD_NEWEST,

    /**
     * The caller will wait till there space in the ringbuffer.
     */
    BLOCK,

    /**
     * The publish call immediately fails.
     */
    ERROR

}
