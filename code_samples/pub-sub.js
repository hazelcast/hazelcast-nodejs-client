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
'use strict';

const { Client } = require('hazelcast-client');


(async () => {
  try {
    const client = await Client.newHazelcastClient();

    const topicName = "test";
    let topic = await client.getReliableTopic(topicName);
    topic.addMessageListener((topic) => {
      console.log("listened topic", topic);

    });
    await topic.publish("price")
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await client.shutdown();
  } catch (err) {
    console.error('Error occurred:', err);
  }
})();
