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
exports.restValueFactory = exports.RestValue = exports.REST_VALUE_CLASS_ID = exports.REST_VALUE_FACTORY_ID = void 0;
/** @internal */
exports.REST_VALUE_FACTORY_ID = -25;
/** @internal */
exports.REST_VALUE_CLASS_ID = 1;
/**
 * Wrapper for values stored via Hazelcast REST API.
 */
class RestValue {
    constructor() {
        /** @ignore */
        this.factoryId = exports.REST_VALUE_FACTORY_ID;
        /** @ignore */
        this.classId = exports.REST_VALUE_CLASS_ID;
    }
    /** @ignore */
    readData(input) {
        this.value = input.readString();
        this.contentType = input.readString();
    }
    /** @ignore */
    writeData(output) {
        output.writeString(this.value);
        output.writeString(this.contentType);
    }
}
exports.RestValue = RestValue;
/** @internal */
function restValueFactory(classId) {
    if (classId === exports.REST_VALUE_CLASS_ID) {
        return new RestValue();
    }
    return null;
}
exports.restValueFactory = restValueFactory;
//# sourceMappingURL=RestValue.js.map