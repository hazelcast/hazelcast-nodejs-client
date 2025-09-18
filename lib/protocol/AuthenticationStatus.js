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
exports.AuthenticationStatus = void 0;
/**
 * Status codes of authentication results.
 * @internal
 */
var AuthenticationStatus;
(function (AuthenticationStatus) {
    AuthenticationStatus[AuthenticationStatus["AUTHENTICATED"] = 0] = "AUTHENTICATED";
    AuthenticationStatus[AuthenticationStatus["CREDENTIALS_FAILED"] = 1] = "CREDENTIALS_FAILED";
    AuthenticationStatus[AuthenticationStatus["SERIALIZATION_VERSION_MISMATCH"] = 2] = "SERIALIZATION_VERSION_MISMATCH";
    AuthenticationStatus[AuthenticationStatus["NOT_ALLOWED_IN_CLUSTER"] = 3] = "NOT_ALLOWED_IN_CLUSTER";
})(AuthenticationStatus = exports.AuthenticationStatus || (exports.AuthenticationStatus = {}));
//# sourceMappingURL=AuthenticationStatus.js.map