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

/**
 * Distributed object listener notifies when a distributed object
 * is created or destroyed cluster-wide.
 */
export type DistributedObjectListener = (event: DistributedObjectEvent) => void;

/**
 * DistributedObjectEvent is fired when a DistributedObject
 * is created or destroyed cluster-wide.
 */
export class DistributedObjectEvent {

    /**
     * The type of this event; one of 'created' or 'destroyed'.
     */
    eventType: string;

    /**
     * The service name of related DistributedObject.
     */
    serviceName: string;

    /**
     * The name of related DistributedObject.
     */
    objectName: string;

    constructor(eventType: string, serviceName: string, objectName: string) {
        this.eventType = eventType;
        this.serviceName = serviceName;
        this.objectName = objectName;
    }

}
