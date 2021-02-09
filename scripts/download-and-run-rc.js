'use strict';
const fs = require('fs');
const os = require('os');
const {spawnSync} = require('child_process');
const net = require('net');

const HZ_VERSION = '4.1.1';
const HZ_TEST_VERSION = '4.1.1';
const HAZELCAST_TEST_VERSION = HZ_TEST_VERSION;
const HAZELCAST_VERSION = HZ_VERSION;
const HAZELCAST_ENTERPRISE_VERSION = HZ_VERSION;
const HAZELCAST_ENTERPRISE_TEST_VERSION = HZ_VERSION;
const HAZELCAST_RC_VERSION = '0.8-SNAPSHOT';
const SNAPSHOT_REPO = 'https://oss.sonatype.org/content/repositories/snapshots';
const RELEASE_REPO = 'http://repo1.maven.apache.org/maven2';
const ENTERPRISE_RELEASE_REPO = 'https://repository.hazelcast.com/release/';
const ENTERPRISE_SNAPSHOT_REPO = 'https://repository.hazelcast.com/snapshot/';
const ON_WINDOWS = os.platform() === 'win32';
const ENV_VARIABLE_SEPARATOR = ON_WINDOWS ? ';' : ':';
const HAZELCAST_ENTERPRISE_KEY = process.env.HAZELCAST_ENTERPRISE_KEY ? process.env.HAZELCAST_ENTERPRISE_KEY : '';

let REPO;
let ENTERPRISE_REPO;

const isAddressReachable = (host, port, timeoutMs) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        const onError = () => {
            socket.destroy();
            resolve(false);
        };
        socket.once('error', onError);
        socket.once('timeout', onError);
        socket.connect(port, host, () => {
            socket.end();
            resolve(true);
        });
    });
}

if (HZ_VERSION.endsWith('-SNAPSHOT')) {
    REPO = SNAPSHOT_REPO;
    ENTERPRISE_REPO = ENTERPRISE_SNAPSHOT_REPO;
} else {
    REPO = RELEASE_REPO;
    ENTERPRISE_REPO = ENTERPRISE_RELEASE_REPO;
}

let TEST_REPO;
let ENTERPRISE_TEST_REPO;

if (HZ_TEST_VERSION.endsWith('-SNAPSHOT')) {
    TEST_REPO = SNAPSHOT_REPO;
    ENTERPRISE_TEST_REPO = ENTERPRISE_SNAPSHOT_REPO;
} else {
    TEST_REPO = RELEASE_REPO;
    ENTERPRISE_TEST_REPO = ENTERPRISE_RELEASE_REPO;
}

if (fs.existsSync(`hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar`)) {
    console.log('remote controller already exists, not downloading from maven.');
} else {
    console.log(`Downloading: remote-controller jar com.hazelcast:hazelcast-remote-controller:${HAZELCAST_RC_VERSION}`);
    const subprocess = spawnSync('mvn',
        [
            '-q',
            'dependency:get',
            `-DrepoUrl=${SNAPSHOT_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-remote-controller:${HAZELCAST_RC_VERSION}`,
            `-Ddest=hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
    if (subprocess.status !== 0) {
        console.log('Failed download remote-controller jar '
            + `com.hazelcast:hazelcast-remote-controller:${HAZELCAST_RC_VERSION}`);
        process.exit(1);
    }
}

if (fs.existsSync(`hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar`)) {
    console.log('hazelcast-test.jar already exists, not downloading from maven.');
} else {
    console.log(`Downloading: hazelcast test jar com.hazelcast:hazelcast:${HAZELCAST_TEST_VERSION}:jar:tests`);
    const subprocess = spawnSync('mvn',
        [
            '-q',
            'dependency:get',
            `-DrepoUrl=${TEST_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast:${HAZELCAST_TEST_VERSION}:jar:tests`,
            `-Ddest=hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
    if (subprocess.status !== 0) {
        console.log(`Failed download hazelcast test jar com.hazelcast:hazelcast:${HAZELCAST_TEST_VERSION}:jar:tests`);
        process.exit(1);
    }
}

let CLASSPATH = `hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar${ENV_VARIABLE_SEPARATOR}`
    + `hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar${ENV_VARIABLE_SEPARATOR}`
    + 'test/javaclasses';

if (HAZELCAST_ENTERPRISE_KEY) {
    if (fs.existsSync(`hazelcast-enterprise-${HAZELCAST_ENTERPRISE_VERSION}.jar`)) {
        console.log('hazelcast-enterprise.jar already exists, not downloading from maven.');
    } else {
        console.log(`Downloading: hazelcast enterprise jar `
            + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_ENTERPRISE_VERSION}`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'dependency:get',
            `-DrepoUrl=${ENTERPRISE_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-enterprise:${HAZELCAST_ENTERPRISE_VERSION}`,
            `-Ddest=hazelcast-enterprise-${HAZELCAST_ENTERPRISE_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            console.log(`Failed download hazelcast enterprise jar `
                + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_ENTERPRISE_VERSION}`);
            process.exit(1);
        }
    }

    if (fs.existsSync(`hazelcast-enterprise-${HAZELCAST_TEST_VERSION}-tests.jar`)) {
        console.log('hazelcast-enterprise-tests.jar already exists, not downloading from maven.');
    } else {
        console.log('Downloading: hazelcast enterprise test jar '
            + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_TEST_VERSION}:jar:tests`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'org.apache.maven.plugins:maven-dependency-plugin:2.8:get',
            `-DrepoUrl=${ENTERPRISE_TEST_REPO}`,
            `-Dartifact=com.hazelcast:hazelcast-enterprise:${HAZELCAST_TEST_VERSION}:jar:tests`,
            `-Ddest=hazelcast-enterprise-${HAZELCAST_TEST_VERSION}-tests.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            console.log('Failed to download hazelcast enterprise test jar '
                + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_TEST_VERSION}:jar:tests`);
            process.exit(1);
        }
    }
    CLASSPATH = `hazelcast-enterprise-${HAZELCAST_ENTERPRISE_VERSION}.jar${ENV_VARIABLE_SEPARATOR}`
        + `hazelcast-enterprise-${HAZELCAST_ENTERPRISE_TEST_VERSION}-tests.jar${ENV_VARIABLE_SEPARATOR}`
        + CLASSPATH;
    console.log('Starting Remote Controller ... enterprise ...');
} else {
    if (fs.existsSync(`hazelcast-${HAZELCAST_VERSION}.jar`)) {
        console.log('hazelcast.jar already exists, not downloading from maven.');
    } else {
        console.log(`Downloading: hazelcast jar com.hazelcast:hazelcast:${HAZELCAST_VERSION}`);
        const subprocess = spawnSync('mvn', [
            '-q',
            'dependency:get',
            `-DrepoUrl=${REPO}`,
            `-Dartifact=com.hazelcast:hazelcast:${HAZELCAST_VERSION}`,
            `-Ddest=hazelcast-${HAZELCAST_VERSION}.jar`
        ], {
            stdio: 'inherit',
            shell: ON_WINDOWS
        });
        if (subprocess.status !== 0) {
            console.log(`Failed download hazelcast jar com.hazelcast:hazelcast:${HAZELCAST_VERSION}`);
            process.exit(1);
        }
    }
    CLASSPATH = `hazelcast-${HAZELCAST_VERSION}.jar${ENV_VARIABLE_SEPARATOR}${CLASSPATH}`;
    console.log('Starting Remote Controller ... oss ...');
}

async function start() {
    if (ON_WINDOWS) {
        spawnSync('start /min "hazelcast-remote-controller" cmd /c '
            + `java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH} `
            + 'com.hazelcast.remotecontroller.Main --use-simple-server> rc_stdout.txt 2>rc_stderr.txt', [], {
            stdio: 'inherit',
            shell: true
        });
    } else {
        spawnSync(`nohup java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH} `
            + 'com.hazelcast.remotecontroller.Main --use-simple-server > rc_stdout.log 2> rc_stderr.log &', [], {
            stdio: 'inherit',
            shell: true
        });
    }

    console.log('Please wait for Hazelcast Remote Controller to start ...');

    const retryCount = 10;

    for (let i = 0; i < retryCount; i++) {
        console.log('Trying to connect to 127.0.0.1:9701...');
        const addressReachable = await isAddressReachable('127.0.0.1', 9701, 5000);
        if (addressReachable) {
            return;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Could not reach to 127.0.0.1:9701 after trying ${retryCount} times.`);
}

start().then(() => {
    console.log('Hazelcast Remote Controller is started!');
}).catch(err => {
    console.log('Could not start Hazelcast Remote Controller due to an error:', err);
    process.exit(1);
})
