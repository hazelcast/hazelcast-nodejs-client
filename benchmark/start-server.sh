#!/bin/sh

HAZELCAST_TEST_VERSION="4.2.1-SNAPSHOT"
HAZELCAST_VERSION="4.2.1-SNAPSHOT"
PID=$$
CLASSPATH="../hazelcast-${HAZELCAST_VERSION}.jar:../hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar"
java -cp ${CLASSPATH} \
    com.hazelcast.core.server.HazelcastMemberStarter
