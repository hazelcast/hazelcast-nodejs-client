/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {DistributedObject} from '../core';
import {MessageListener} from './MessageListener';

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
     * This method is for only Reliable Topic since this is a sync method.
     * When this method is called from Topic, it throws HazelcastError.
     * Check addListener method for using with Topic.
     *
     * @param listener the MessageListener to add
     * @return registration ID
     * @throws HazelcastError if it is used from Topic
     */
    addMessageListener(listener: MessageListener<E>): string;

    /**
     * Stops receiving messages for the given message listener.
     *
     * If the given listener already removed, this method does nothing.
     *
     * This method is for only Reliable Topic.
     * When this method is called from Topic, it throws HazelcastError.
     * Check removeListener method for using with Topic.
     *
     * @param listenerId listener registration ID
     * @return `true` if registration is removed, `false` otherwise
     * @throws HazelcastError if it is used from Topic
     */
    removeMessageListener(listenerId: string): boolean;

    /**
     * Publishes the message to all subscribers of this topic.
     *
     * @param message the message to publish to all subscribers of this topic
     */
    publish(message: E): Promise<void>;

    /**
     * Publishes all messages to all subscribers of this topic.
     *
     * @param messages the messages to publish to all subscribers of this topic
     * @throws TopicOverloadException if the consumer is too slow
 *                                      (only works in combination with reliable topic)
     */
    publishAll(messages: any[]): Promise<void>;

    /**
     * Subscribes to this topic. When a message is published,
     * the given MessageListener is called.
     *
     * More than one message listener can be added on one instance.
     *
     * This method is for only Topic since this is an async method.
     * When this method is called from Reliable Topic, it throws HazelcastError.
     * Check addMessageListener method for using with Reliable Topic.
     *
     * @param listener the MessageListener to add
     * @return registration ID
     * @throws HazelcastError if it is used from Reliable Topic
     */
    addListener(listener: MessageListener<E>): Promise<string>;

    /**
     * Stops receiving messages for the given message listener.
     *
     * If the given listener already removed, this method does nothing.
     *
     * This method is for only Topic.
     * When this method is called from Reliable Topic, it throws Hazelcast Error.
     *
     * @param listenerId listener registration ID
     * @return `true` if registration is removed, `false` otherwise
     * @throws HazelcastError if it is used from Reliable Topic
     */
    removeListener(listenerId: string): Promise<boolean>;
}
