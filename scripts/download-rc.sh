#!/bin/sh
HZ_VERSION="3.9"
HAZELCAST_TEST_VERSION=${HZ_VERSION}
HAZELCAST_VERSION=${HZ_VERSION}
HAZELCAST_ENTERPRISE_VERSION=${HZ_VERSION}
HAZELCAST_RC_VERSION="0.3-SNAPSHOT"
SNAPSHOT_REPO="https://oss.sonatype.org/content/repositories/snapshots"
RELEASE_REPO="http://repo1.maven.apache.org/maven2"
ENTERPRISE_RELEASE_REPO="https://repository-hazelcast-l337.forge.cloudbees.com/release/"
ENTERPRISE_SNAPSHOT_REPO="https://repository-hazelcast-l337.forge.cloudbees.com/snapshot/"

if [[ ${HZ_VERSION} == *-SNAPSHOT ]]
then
	REPO=${SNAPSHOT_REPO}
	ENTERPRISE_REPO=${ENTERPRISE_SNAPSHOT_REPO}
else
	REPO=${RELEASE_REPO}
	ENTERPRISE_REPO=${ENTERPRISE_RELEASE_REPO}
fi

mvn dependency:get -DrepoUrl=${SNAPSHOT_REPO} -Dartifact=com.hazelcast:hazelcast-remote-controller:${HAZELCAST_RC_VERSION} -Ddest=hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar
mvn dependency:get -DrepoUrl=${REPO} -Dartifact=com.hazelcast:hazelcast:${HAZELCAST_VERSION} -Ddest=hazelcast-${HAZELCAST_VERSION}.jar

if [ -n "${HAZELCAST_ENTERPRISE_KEY}" ]; then
    mvn dependency:get -DrepoUrl=${REPO} -Dartifact=com.hazelcast:hazelcast:${HAZELCAST_VERSION}:jar:tests -Ddest=hazelcast-tests-${HAZELCAST_VERSION}.jar
    mvn dependency:get -DrepoUrl=${ENTERPRISE_REPO} -Dartifact=com.hazelcast:hazelcast-enterprise:${HAZELCAST_VERSION} -Ddest=hazelcast-enterprise-${HAZELCAST_VERSION}.jar
    CLASSPATH="hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar:hazelcast-enterprise-${HAZELCAST_VERSION}.jar:hazelcast-${HAZELCAST_VERSION}.jar:hazelcast-tests-${HAZELCAST_VERSION}.jar:test/javaclasses"
    echo "Starting Remote Controller ... enterprise ..."
else
    CLASSPATH="hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar:hazelcast-${HAZELCAST_VERSION}.jar:test/javaclasses"
    echo "Starting Remote Controller ... oss ..."
fi

nohup java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH}  com.hazelcast.remotecontroller.Main>rc_stdout.log 2>rc_stderr.log &

sleep 10

