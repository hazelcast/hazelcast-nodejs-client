/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import * as Promise from 'bluebird';
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
 */
export interface ITopic<E> extends DistributedObject {

    /**
     * Subscribes to this topic. When a message is published, the
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
