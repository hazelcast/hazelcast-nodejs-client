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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableTopicConfigImpl = void 0;
const proxy_1 = require("../proxy");
/** @internal */
class ReliableTopicConfigImpl {
    constructor() {
        this.readBatchSize = 10;
        this.overloadPolicy = proxy_1.TopicOverloadPolicy.BLOCK;
    }
    toString() {
        return 'ReliableTopicConfig[' +
            'name: ' + this.name + ', ' +
            'readBatchSize: ' + this.readBatchSize + ', ' +
            'overloadPolicy: ' + this.overloadPolicy + ']';
    }
    clone() {
        const other = new ReliableTopicConfigImpl();
        Object.assign(other, this);
        return other;
    }
}
exports.ReliableTopicConfigImpl = ReliableTopicConfigImpl;
//# sourceMappingURL=ReliableTopicConfig.js.map