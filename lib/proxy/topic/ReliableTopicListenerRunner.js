"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableTopicListenerRunner = void 0;
const core_1 = require("../../core");
const MessageListener_1 = require("../MessageListener");
/** @internal */
class ReliableTopicListenerRunner {
    constructor(listenerId, listener, ringbuffer, batchSize, serializationService, logger, proxy) {
        this.sequenceNumber = 0;
        this.cancelled = false;
        this.listenerId = listenerId;
        this.listener = listener;
        this.ringbuffer = ringbuffer;
        this.batchSize = batchSize;
        this.serializationService = serializationService;
        this.proxy = proxy;
        this.logger = logger;
    }
    next() {
        if (this.cancelled) {
            return;
        }
        this.ringbuffer.readMany(this.sequenceNumber, 1, this.batchSize)
            .then((result) => {
            if (this.cancelled) {
                return;
            }
            const nextSeq = result.getNextSequenceToReadFrom().toNumber();
            const lostCount = nextSeq - result.getReadCount() - this.sequenceNumber;
            // If messages were lost, behave as a loss tolerant listener
            if (lostCount !== 0) {
                this.logger.warn('ReliableTopicListenerRunner', 'Listener of topic: '
                    + this.proxy.getName() + ' lost ' + lostCount + ' messages.');
            }
            for (let i = 0; i < result.size(); i++) {
                const msg = new MessageListener_1.Message();
                const item = result.get(i);
                msg.messageObject = this.serializationService.toObject(item.payload);
                msg.publisher = item.publisherAddress;
                msg.publishingTime = item.publishTime;
                process.nextTick(this.listener, msg);
            }
            this.sequenceNumber = nextSeq;
            this.next();
        })
            .catch((err) => {
            if (this.handleInternalError(err)) {
                setImmediate(this.next.bind(this));
            }
            else {
                this.proxy.removeMessageListener(this.listenerId);
            }
        });
    }
    cancel() {
        this.cancelled = true;
    }
    handleInternalError(err) {
        if (err instanceof core_1.OperationTimeoutError) {
            this.logger.trace('ReliableTopicListenerRunner', 'Listener of topic: ' + this.proxy.getName()
                + ' timed out. Continuing from last known sequence: ' + this.sequenceNumber);
            return true;
        }
        else if (err instanceof core_1.ClientOfflineError) {
            this.logger.trace('ReliableTopicListenerRunner', 'Listener of topic: ' + this.proxy.getName()
                + ' got error: ' + err + '. Continuing from last known sequence: ' + this.sequenceNumber);
            return true;
        }
        else if (err instanceof core_1.ClientNotActiveError) {
            this.logger.trace('ReliableTopicListenerRunner', 'Terminating listener of topic: '
                + this.proxy.getName() + '. Reason: HazelcastClient is shutting down.');
            return false;
        }
        else {
            this.logger.warn('ReliableTopicListenerRunner', 'Listener of topic: ' + this.proxy.getName()
                + ' caught an exception, terminating listener. ' + err);
        }
        return false;
    }
}
exports.ReliableTopicListenerRunner = ReliableTopicListenerRunner;
//# sourceMappingURL=ReliableTopicListenerRunner.js.map