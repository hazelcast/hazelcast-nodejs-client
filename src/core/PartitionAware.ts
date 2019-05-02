/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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
 * Implementing PartitionAware allows one to override the default partitioning scheme.
 * Instead of using the keys themselves to spread the data around the cluster the
 * key returned by {@link getPartitionKey} is used.
 * <p/>
 * This provides the user with an ability to contain related keys within the same
 * partition and, consequently, within the same node.
 * <p/>
 * In Hazelcast, disparate data structures will be stored on the same partition,
 * based on the partition key. For example, if "Steve" was used, then the following would be on one partition.
 * <ul>
 *     <li>a customers IMap with an entry of key "Steve"</li>
 *     <li>an orders IMap using a customer key type implementing PartitionAware with key "Steve</li>
 *     <li>any queue named "Steve"</li>
 *     <li>any PartitionAware object with partition key "Steve"</li>
 * </ul>
 */
export interface PartitionAware<T> {
    /**
     * The key that will be used by Hazelcast to specify the partition.
     * You should give the same key for objects that you want to be in the same partition.
     */
    getPartitionKey(): T;
}
