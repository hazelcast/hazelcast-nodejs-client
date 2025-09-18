import { DistributedObject } from '../core';
import { MessageListener } from './MessageListener';
/**
 * Hazelcast provides distribution mechanism for publishing messages that are
 * delivered to multiple subscribers, which is also known as a publish/subscribe
 * (pub/sub) messaging model. Publish and subscriptions are cluster-wide.
 *
 * This interface stand for reliable topic, i.e. it uses a Ringbuffer to store
 * events. The events in the Ringbuffer are replicated, so they won't get
 * lost when a node goes down.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type. Also they may throw {@link HazelcastSerializationError} if a compact
 * object is cannot be deserialized due to unknown schema.
 */
export interface ITopic<E> extends DistributedObject {
    /**
     * Subscribes to this topic. When a message is published,
     * the given MessageListener is called.
     *
     * More than one message listener can be added on one instance.
     *
     * @param listener the MessageListener to add
     * @return registration ID
     */
    addMessageListener(listener: MessageListener<E>): string;
    /**
     * Stops receiving messages for the given message listener.
     *
     * If the given listener already removed, this method does nothing.
     *
     * @param listenerId listener registration ID
     * @return `true` if registration is removed, `false` otherwise
     */
    removeMessageListener(listenerId: string): boolean;
    /**
     * Publishes the message to all subscribers of this topic.
     *
     * @param message the message to publish to all subscribers of this topic
     */
    publish(message: E): Promise<void>;
}
