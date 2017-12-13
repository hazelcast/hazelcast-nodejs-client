#!/usr/bin/env bash

JAR_DIR="../.."

java -Dhazelcast.config=hazelcast_soak_test.xml -cp ${JAR_DIR}/hazelcast-3.9.jar:${JAR_DIR}/hazelcast-3.10-SNAPSHOT-tests.jar com.hazelcast.core.server.StartServer
