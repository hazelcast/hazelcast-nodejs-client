#!/bin/sh

HAZELCAST_TEST_VERSION="4.2"
HAZELCAST_VERSION="4.2"
PID=$$

CLASSPATH="../../hazelcast-${HAZELCAST_VERSION}.jar:../../hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar"
CMD_CONFIGS="-Dhazelcast.multicast.group=224.206.1.1 -Djava.net.preferIPv4Stack=true"
java ${CMD_CONFIGS} -cp ${CLASSPATH} \
    com.hazelcast.core.server.HazelcastMemberStarter \
    > hazelcast-${HAZELCAST_VERSION}-${PID}-out.log 2>hazelcast-${HAZELCAST_VERSION}-${PID}-err.log &
