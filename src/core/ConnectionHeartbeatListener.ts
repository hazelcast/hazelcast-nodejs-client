/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

import {ClientConnection} from '../invocation/ClientConnection';

/**
 * Listener interface for heartbeat service.
 */
export interface ConnectionHeartbeatListener {
    /**
     * Invoked when heartbeat of a server is restored after stopped.
     * @param connection connection object associated with that server node.
     */
    onHeartbeatRestored?: (connection?: ClientConnection) => void;
    /**
     * Invoked when heartbeat of a server node failed.
     * @param connection connection object associated with that server node.
     */
    onHeartbeatStopped?: (connection?: ClientConnection) => void;
}
