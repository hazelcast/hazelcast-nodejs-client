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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
/**
 * Public API re-exports.
 */
__exportStar(require("./aggregation"), exports);
__exportStar(require("./config"), exports);
__exportStar(require("./connection"), exports);
__exportStar(require("./core"), exports);
__exportStar(require("./logging"), exports);
__exportStar(require("./proxy"), exports);
__exportStar(require("./serialization"), exports);
var HazelcastClient_1 = require("./HazelcastClient");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return HazelcastClient_1.HazelcastClient; } });
__exportStar(require("./LifecycleService"), exports);
__exportStar(require("./PartitionService"), exports);
__exportStar(require("./CPSubsystem"), exports);
__exportStar(require("./sql"), exports);
__exportStar(require("./security"), exports);
//# sourceMappingURL=index.js.map