'use strict';
const fs = require('fs');
const os = require('os');
const {spawnSync} = require('child_process');
const rcParams = require('./rc-params');

const ON_WINDOWS = os.platform() === 'win32';

let REPO;
let ENTERPRISE_REPO;
let TEST_REPO;
let ENTERPRISE_TEST_REPO;

if (rcParams.HZ_VERSION.endsWith('-SNAPSHOT')) {
    REPO = rcParams.SNAPSHOT_REPO;
    ENTERPRISE_REPO = rcParams.ENTERPRISE_SNAPSHOT_REPO;
} else {
    REPO = rcParams.RELEASE_REPO;
    ENTERPRISE_REPO = rcParams.ENTERPRISE_RELEASE_REPO;
}

if (rcParams.HZ_TEST_VERSION.endsWith('-SNAPSHOT')) {
    TEST_REPO = rcParams.SNAPSHOT_REPO;
    ENTERPRISE_TEST_REPO = rcParams.ENTERPRISE_SNAPSHOT_REPO;
} else {
    TEST_REPO = rcParams.RELEASE_REPO;
    ENTERPRISE_TEST_REPO = rcParams.ENTERPRISE_RELEASE_REPO;
}

if (fs.existsSync(`hazelcast-remote-controller-${rcParams.HAZELCAST_RC_VERSION}.jar`)) {
    console.log('remote controller already exists, not downloading from maven.');
} else {
    console.log('Downloading: remote-controller jar'
              + `com.hazelcast:hazelcast-remote-controller:${rcParams.HAZELCAST_RC_VERSION}`);
    const subprocess = spawnSync('mvn',
        [
            '-q',
            'dependency:get',
            `-DrepoUrl=${rcParams.SNAPSHOT_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-remote-controller:${rcParams.HAZELCAST_RC_VERSION}`,
            `-Ddest=hazelcast-remote-controller-${rcParams.HAZELCAST_RC_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
    if (subprocess.status !== 0) {
        throw 'Failed download remote-controller jar '
            + `com.hazelcast:hazelcast-remote-controller:${rcParams.HAZELCAST_RC_VERSION}`;
    }
}

if (fs.existsSync(`hazelcast-${rcParams.HAZELCAST_TEST_VERSION}-tests.jar`)) {
    console.log('hazelcast-test.jar already exists, not downloading from maven.');
} else {
    console.log(`Downloading: hazelcast test jar com.hazelcast:hazelcast:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`);
    const subprocess = spawnSync('mvn',
        [
            '-q',
            'dependency:get',
            `-DrepoUrl=${TEST_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`,
            `-Ddest=hazelcast-${rcParams.HAZELCAST_TEST_VERSION}-tests.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
    if (subprocess.status !== 0) {
        throw `Failed download hazelcast test jar com.hazelcast:hazelcast:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`;
    }
}

if (rcParams.HAZELCAST_ENTERPRISE_KEY) {
    if (fs.existsSync(`hazelcast-enterprise-${rcParams.HAZELCAST_ENTERPRISE_VERSION}.jar`)) {
        console.log('hazelcast-enterprise.jar already exists, not downloading from maven.');
    } else {
        console.log(`Downloading: hazelcast enterprise jar `
                  + `com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_ENTERPRISE_VERSION}`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'dependency:get',
            `-DrepoUrl=${ENTERPRISE_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_ENTERPRISE_VERSION}`,
            `-Ddest=hazelcast-enterprise-${rcParams.HAZELCAST_ENTERPRISE_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            throw `Failed download hazelcast enterprise jar `
                + `com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_ENTERPRISE_VERSION}`;
        }
    }

    if (fs.existsSync(`hazelcast-enterprise-${rcParams.HAZELCAST_TEST_VERSION}-tests.jar`)) {
        console.log('hazelcast-enterprise-tests.jar already exists, not downloading from maven.');
    } else {
        console.log('Downloading: hazelcast enterprise test jar '
                  + `com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'org.apache.maven.plugins:maven-dependency-plugin:2.8:get',
            `-DrepoUrl=${ENTERPRISE_TEST_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`,
            `-Ddest=hazelcast-enterprise-${rcParams.HAZELCAST_TEST_VERSION}-tests.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            throw 'Failed to download hazelcast enterprise test jar '
                + `com.hazelcast:hazelcast-enterprise:${rcParams.HAZELCAST_TEST_VERSION}:jar:tests`;
        }
    }
    console.log('Starting Remote Controller ... enterprise ...');
} else {
    if (fs.existsSync(`hazelcast-${rcParams.HAZELCAST_VERSION}.jar`)) {
        console.log('hazelcast.jar already exists, not downloading from maven.');
    } else {
        console.log(`Downloading: hazelcast jar com.hazelcast:hazelcast:${rcParams.HAZELCAST_VERSION}`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'dependency:get',
            `-DrepoUrl=${REPO}`,
            `-Dartifact=com.hazelcast:hazelcast:${rcParams.HAZELCAST_VERSION}`,
            `-Ddest=hazelcast-${rcParams.HAZELCAST_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            throw `Failed download hazelcast jar com.hazelcast:hazelcast:${rcParams.HAZELCAST_VERSION}`;
        }
    }
    console.log('Starting Remote Controller ... oss ...');
}
