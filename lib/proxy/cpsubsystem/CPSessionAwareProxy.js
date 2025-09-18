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
exports.CPSessionAwareProxy = void 0;
const BaseCPProxy_1 = require("./BaseCPProxy");
/**
 * Common super class for CP Subsystem proxies that make use of Raft sessions.
 * @internal
 */
class CPSessionAwareProxy extends BaseCPProxy_1.BaseCPProxy {
    constructor(serviceName, groupId, proxyName, objectName, invocationService, serializationService, cpSessionManager) {
        super(serviceName, groupId, proxyName, objectName, invocationService, serializationService);
        this.threadIdSeq = 0;
        this.sessionManager = cpSessionManager;
    }
    /**
     * As Node.js client implements non-reentrant concurrent primitives,
     * we generate a new "thread id" per each acquire attempt.
     */
    nextThreadId() {
        return this.threadIdSeq++;
    }
    getSessionId() {
        return this.sessionManager.getSessionId(this.groupId);
    }
    acquireSession(permits) {
        return this.sessionManager.acquireSession(this.groupId, permits);
    }
    releaseSession(sessionId, permits) {
        return this.sessionManager.releaseSession(this.groupId, sessionId, permits);
    }
    invalidateSession(sessionId) {
        return this.sessionManager.invalidateSession(this.groupId, sessionId);
    }
}
exports.CPSessionAwareProxy = CPSessionAwareProxy;
//# sourceMappingURL=CPSessionAwareProxy.js.map