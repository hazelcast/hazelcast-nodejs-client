'use strict';
const fs = require('fs');
const os = require('os');
const {spawnSync, spawn} = require('child_process');
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

let MOCHA_COMMAND;
let REPO;
let ENTERPRISE_REPO;
let CLASSPATH;

let testType;
let rcProcess;
let mochaProcess;

const downloadDependencies = () => {
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
            throw 'Failed download remote-controller jar '
            + `com.hazelcast:hazelcast-remote-controller:${HAZELCAST_RC_VERSION}`;
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
            throw `Failed download hazelcast test jar com.hazelcast:hazelcast:${HAZELCAST_TEST_VERSION}:jar:tests`;
        }
    }

    CLASSPATH = `hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar${ENV_VARIABLE_SEPARATOR}`
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
                throw `Failed download hazelcast enterprise jar `
                + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_ENTERPRISE_VERSION}`;
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
                throw 'Failed to download hazelcast enterprise test jar '
                + `com.hazelcast:hazelcast-enterprise:${HAZELCAST_TEST_VERSION}:jar:tests`;
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
                throw `Failed download hazelcast jar com.hazelcast:hazelcast:${HAZELCAST_VERSION}`;
            }
        }
        CLASSPATH = `hazelcast-${HAZELCAST_VERSION}.jar${ENV_VARIABLE_SEPARATOR}${CLASSPATH}`;
        console.log('Starting Remote Controller ... oss ...');
    }
}
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
const startRC = async (background) => {
    if (ON_WINDOWS) {
        if (background) {
            rcProcess = spawn('start /min "hazelcast-remote-controller" cmd /c '
                + `java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH} `
                + 'com.hazelcast.remotecontroller.Main --use-simple-server> rc_stdout.txt 2>rc_stderr.txt', [], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
        } else {
            rcProcess = spawn(`java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH} `
                + 'com.hazelcast.remotecontroller.Main --use-simple-server> rc_stdout.txt 2>rc_stderr.txt', [], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
        }

    } else {
        if (background) {
            rcProcess = spawn(`nohup java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} `
                + `-cp ${CLASSPATH} com.hazelcast.remotecontroller.Main --use-simple-server> rc_stdout.txt`
                + '2>rc_stderr.txt &', [], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
        } else {
            rcProcess = spawn(`java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} `
                + `-cp ${CLASSPATH} com.hazelcast.remotecontroller.Main --use-simple-server > rc_stdout.log `
                + '2> rc_stderr.log', [], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
        }
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

if (process.argv.length === 3) {
    if (process.argv[2] === 'unit') {
        MOCHA_COMMAND = 'mocha "test/unit/**/*.js"';
        testType = 'unit';
    } else if (process.argv[2] === 'integration') {
        MOCHA_COMMAND = 'mocha "test/integration/**/*.js"';
        testType = 'integration';
    } else if (process.argv[2] === 'alltests') {
        MOCHA_COMMAND = 'mocha "test/**/*.js"';
        testType = 'alltests';
    } else if (process.argv[2] === 'startrc') {
        downloadDependencies();
        startRC(true).then(() => {
            console.log('Hazelcast Remote Controller is started!');
            process.exit(0);
        }).catch(err => {
            console.log('Could not start Hazelcast Remote Controller due to an error:');
            throw err;
        });
    } else {
        throw 'Operation type can be one of "unit", "integration", "alltests", "startrc"';
    }
} else {
    throw 'Usage: node <script-file> <operation-type>. '
    + 'Operation type can be one of "unit", "integration", "alltests", "startrc"';
}

if (!fs.existsSync('./lib')) {
    console.log('lib folder does not exists compiling..');
    spawnSync('npm run compile', [], {
        stdio: 'inherit',
        shell: true
    });
}

if (testType === 'unit') {
    console.log(`Running unit tests... Mocha command: ${MOCHA_COMMAND}`);
    spawnSync(MOCHA_COMMAND, [], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
    });
    process.exit(0);
}

const shutdownRC = async () => {
    console.log('Stopping remote controller and mocha...');
    if (rcProcess) rcProcess.kill('SIGKILL');
    if (mochaProcess) mochaProcess.kill('SIGKILL');
};

process.on('SIGINT', shutdownRC);
process.on('SIGTERM', shutdownRC);
process.on('SIGHUP', shutdownRC);

downloadDependencies();

startRC(false).then(() => {
    console.log('Hazelcast Remote Controller is started!');
    console.log(`Running tests... Test type: ${testType}, Mocha command: ${MOCHA_COMMAND}`);
    mochaProcess = spawn(MOCHA_COMMAND, [], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
    });
}).catch(err => {
    console.log('Could not start Hazelcast Remote Controller due to an error:');
    throw err;
});
