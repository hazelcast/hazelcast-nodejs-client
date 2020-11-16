package com.company;

import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;

public class Bootstrap {
    public static void main(String[] args) {
        HazelcastInstance member = Hazelcast.newHazelcastInstance();
    }
}
