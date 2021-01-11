/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {Member} from './Member';

/**
 * Event for member attribute changes.
 */
export class MemberAttributeEvent {
    /**
     * the member for this MemberAttributeEvent.
     */
    member: Member;

    /**
     * the key for this MemberAttributeEvent.
     */
    key: string;

    /**
     * the type of member attribute change for this MemberAttributeEvent.
     */
    operationType: MemberAttributeOperationType;

    /**
     * the value for this MemberAttributeEvent.
     */
    value: string;

    constructor(member: Member, key: string, operationType: MemberAttributeOperationType, value: string) {
        this.member = member;
        this.key = key;
        this.operationType = operationType;
        this.value = value;
    }
}

/**
 * Used to identify the type of member attribute change, either PUT or REMOVED.
 *
 */
export enum MemberAttributeOperationType {
    /**
     * Indicates an attribute being put.
     */
    PUT = 1,

    /**
     * Indicates an attribute being removed.
     */
    REMOVE = 2,
}
