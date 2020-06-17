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

import {MembershipListener} from '../core/MembershipListener';
import {LifecycleState} from '../LifecycleService';

/**
 * Configurations for LifecycleListeners. These are registered as soon as client started.
 */
export class ListenerConfig {
    lifecycleListeners: Array<(state: LifecycleState) => void> = [];
    membershipListeners: MembershipListener[] = [];

    addLifecycleListener(listener: (state: LifecycleState) => void): void {
        this.lifecycleListeners.push(listener);
    }

    addMembershipListener(listener: MembershipListener): void {
        this.membershipListeners.push(listener);
    }

    getLifecycleListeners(): Array<(state: LifecycleState) => void> {
        return this.lifecycleListeners;
    }

    getMembershipListeners(): MembershipListener[] {
        return this.membershipListeners;
    }
}
