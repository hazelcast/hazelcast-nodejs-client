package com.hazelcast.client.node;

import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;

public class Server {
    public static void main(String[] args) {
        Config config = new Config();
        config.getGroupConfig().setName("NodeJS");
        config.getGroupConfig().setPassword("LetMeIn");
        Hazelcast.newHazelcastInstance(config);
    }
}
