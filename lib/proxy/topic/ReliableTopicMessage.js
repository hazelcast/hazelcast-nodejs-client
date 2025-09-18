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
exports.reliableTopicMessageFactory = exports.ReliableTopicMessage = exports.RELIABLE_TOPIC_CLASS_ID = exports.RELIABLE_TOPIC_MESSAGE_FACTORY_ID = void 0;
/** @internal */
exports.RELIABLE_TOPIC_MESSAGE_FACTORY_ID = -9;
/** @internal */
exports.RELIABLE_TOPIC_CLASS_ID = 2;
/** @internal */
class ReliableTopicMessage {
    constructor() {
        this.factoryId = exports.RELIABLE_TOPIC_MESSAGE_FACTORY_ID;
        this.classId = exports.RELIABLE_TOPIC_CLASS_ID;
    }
    readData(input) {
        this.publishTime = input.readLong();
        this.publisherAddress = input.readObject();
        this.payload = input.readData();
    }
    writeData(output) {
        output.writeLong(this.publishTime);
        output.writeObject(this.publisherAddress);
        output.writeData(this.payload);
    }
}
exports.ReliableTopicMessage = ReliableTopicMessage;
/** @internal */
function reliableTopicMessageFactory(classId) {
    if (classId === exports.RELIABLE_TOPIC_CLASS_ID) {
        return new ReliableTopicMessage();
    }
    return null;
}
exports.reliableTopicMessageFactory = reliableTopicMessageFactory;
//# sourceMappingURL=ReliableTopicMessage.js.map