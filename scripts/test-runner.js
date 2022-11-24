'use strict';
const fs = require('fs');
const os = require('os');
const net = require('net');
const {spawnSync, spawn} = require('child_process');
const codeSampleChecker = require('./code-sample-checker');

const {
    HAZELCAST_RC_VERSION,
    HAZELCAST_TEST_VERSION,
    HAZELCAST_ENTERPRISE_VERSION,
    HAZELCAST_ENTERPRISE_TEST_VERSION,
    HAZELCAST_VERSION,
    downloadRC
} = require('./download-rc.js');

const DEV_CLUSTER_CONFIG = `
    <hazelcast xmlns="http://www.hazelcast.com/schema/config"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.hazelcast.com/schema/config
        http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
        <cluster-name>dev</cluster-name>
        <jet enabled="true"></jet>
    </hazelcast>
`;
const ON_WINDOWS = os.platform() === 'win32';
const HAZELCAST_ENTERPRISE_KEY = process.env.HAZELCAST_ENTERPRISE_KEY ? process.env.HAZELCAST_ENTERPRISE_KEY : '';
const PATH_SEPARATOR = ON_WINDOWS ? ';' : ':';

let cluster; // We create a cluster for checking code samples

let testCommand;
let testType;
let rcProcess;
let testProcess;
let runTests = true;
let CLASSPATH = `hazelcast-remote-controller-${HAZELCAST_RC_VERSION}.jar${PATH_SEPARATOR}`
              + `hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar${PATH_SEPARATOR}`
              + `hazelcast-sql-${HAZELCAST_VERSION}.jar${PATH_SEPARATOR}`;

if (HAZELCAST_ENTERPRISE_KEY) {
    CLASSPATH = `hazelcast-enterprise-${HAZELCAST_ENTERPRISE_VERSION}.jar${PATH_SEPARATOR}`
              + `hazelcast-enterprise-${HAZELCAST_ENTERPRISE_TEST_VERSION}-tests.jar${PATH_SEPARATOR}`
              + CLASSPATH;
} else {
    CLASSPATH = `hazelcast-${HAZELCAST_VERSION}.jar${PATH_SEPARATOR}${CLASSPATH}`;
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
};

// Import lazily to defer side affect of the import (connection attempt to 9701)
const getRC = () => {
    return require('../test/integration/RC');
};

const startRC = async () => {
    console.log('Starting Hazelcast Remote Controller ... oss ...');
    if (ON_WINDOWS) {
        const outFD = fs.openSync('rc_stdout.log', 'w');
        const errFD = fs.openSync('rc_stderr.log', 'w');
        rcProcess = spawn('java', [
            `-Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY}`,
            '-cp',
            CLASSPATH,
            'com.hazelcast.remotecontroller.Main'
        ], {
            stdio: [
                'ignore',
                outFD,
                errFD
            ]
        });
        rcProcess.on('close', () => {
            fs.closeSync(outFD);
            fs.closeSync(errFD);
        });
    } else {
        const outFD = fs.openSync('rc_stdout.log', 'w');
        const errFD = fs.openSync('rc_stderr.log', 'w');
        rcProcess = spawn('java', [
            `-Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY}`,
            '-cp',
            CLASSPATH,
            'com.hazelcast.remotecontroller.Main'
        ], {
            stdio: [
                'ignore',
                outFD,
                errFD
            ]
        });
        rcProcess.on('close', () => {
            fs.closeSync(outFD);
            fs.closeSync(errFD);
        });
    }

    console.log('Please wait for Hazelcast Remote Controller to start ...');

    const retryCount = 100;

    for (let i = 0; i < retryCount; i++) {
        console.log('Trying to connect to Hazelcast Remote Controller (127.0.0.1:9701)...');
        const addressReachable = await isAddressReachable('127.0.0.1', 9701, 5000);
        if (addressReachable) {
            return;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    throw `Could not reach to Hazelcast Remote Controller (127.0.0.1:9701) after trying ${retryCount} times.`;
};

const shutdown = async () => {
    if (testProcess && testProcess.exitCode === null) {
        stopTestProcess();
    }

    if (rcProcess && rcProcess.exitCode === null) {
        await stopRC();
    }

    if (testProcess && testProcess.exitCode !== null) {
        process.exit(testProcess.exitCode);
    }
};

const stopTestProcess = () => {
    console.log('Stopping test process');
    if (ON_WINDOWS) {
        spawnSync('taskkill', ['/pid', testProcess.pid, '/f', '/t']); // simple sigkill not enough on windows
    } else {
        if (testProcess && testProcess.exitCode === null) {
            testProcess.kill('SIGKILL');
        }
    }
};

const stopRC = async () => {
    console.log('Stopping cluster and remote controller');
    if (cluster) {
        const RC = getRC();
        await RC.terminateCluster(cluster.id);
    }
    if (ON_WINDOWS) {
        spawnSync('taskkill', ['/pid', rcProcess.pid, '/f', '/t']);
    } else {
        if (rcProcess && rcProcess.exitCode === null) {
            rcProcess.kill('SIGKILL');
        }
    }
};

if (process.argv.length === 3 || process.argv.length === 4) {
    if (process.argv[2] === 'unit') {
        if (process.argv.length === 4) {
            testCommand = `node node_modules/mocha/bin/mocha -g "${process.argv[3]}" "test/unit/**/*.js"`;
        } else {
            testCommand = 'node node_modules/mocha/bin/mocha "test/unit/**/*.js"';
        }
        testType = 'unit';
    } else if (process.argv[2] === 'integration') {
        if (process.argv.length === 4) {
            testCommand = `node node_modules/mocha/bin/mocha -g "${process.argv[3]}" ` +
                          '"test/integration/**/serial/**/*.js" && ';
            testCommand += `node node_modules/mocha/bin/mocha -j 2 --parallel -g  "${process.argv[3]}" ` +
                '"test/integration/**/parallel/**/*.js"';
        } else {
            testCommand = 'node node_modules/mocha/bin/mocha "test/integration/**/serial/**/*.js" && node'
                        + ' node_modules/mocha/bin/mocha -j 2 --parallel "test/integration/**/parallel/**/*.js"';
        }
        testType = 'integration';
    } else if (process.argv[2] === 'all') {
        if (process.argv.length === 4) {
            testCommand = `node node_modules/mocha/bin/mocha -g "${process.argv[3]}" "test/unit/**/*.js" && `;
            testCommand += `node node_modules/mocha/bin/mocha -g "${process.argv[3]}" ` +
                '"test/integration/**/serial/**/*.js" && ';
            testCommand += `node node_modules/mocha/bin/mocha -j 2 --parallel -g  "${process.argv[3]}" ` +
                '"test/**/parallel/**/*.js"';
        } else {
            testCommand = 'node node_modules/mocha/bin/mocha "test/unit/**/*.js" && ';
            testCommand += 'node node_modules/mocha/bin/mocha "test/**/serial/**/*.js" && ';
            testCommand += 'node node_modules/mocha/bin/mocha -j 2 --parallel "test/**/parallel/**/*.js"';
        }
        testType = 'all';
    } else if (process.argv[2] === 'startrc') {
        runTests = false;
    } else if (process.argv[2] === 'check-code-samples') {
        runTests = false;
        testType = 'check-code-samples';
    } else {
        throw 'Operation type can be one of "unit", "integration", "all", "startrc", "check-code-samples"';
    }
} else {
    throw 'Usage: node <script-file> <operation-type> [test regex].\n'
        + 'Operation type can be one of "unit", "integration", "all", "startrc", "check-code-samples".\n'
        + '[test regex] only used in "unit", "all" and "integration" operations.';
}

// generate lib folder to be able to test if it does not exist
if (!fs.existsSync('./lib')) {
    console.log('./lib folder does not exist, so compiling...');
    spawnSync('npm run compile', [], {
        stdio: 'inherit',
        shell: true
    });
}

// If running unit test, no need to start rc.
if (testType === 'unit') {
    console.log(`Running unit tests... Test command: ${testCommand}`);
    const subprocess = spawnSync(testCommand, [], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
    });
    process.exit(subprocess.status);
}

// For other tests, download rc files if needed.
try {
    downloadRC();
} catch (err) {
    console.log('An error occurred downloading remote controller:');
    throw err;
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

startRC().then(async () => {
    console.log('Hazelcast Remote Controller is started!');
    if (runTests) {
        console.log(`Running ${testType}, Command: ${testCommand}`);
        testProcess = spawn(testCommand, [], {
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
        });
        testProcess.on('exit', shutdown);
    } else if (testType === 'check-code-samples') {
        const RC = getRC();
        cluster = await RC.createClusterKeepClusterName(null, DEV_CLUSTER_CONFIG);
        let exitCode = 0;
        try {
            await codeSampleChecker.main(cluster);
        } catch (e) {
            console.error(e);
            exitCode = 1;
        } finally {
            await shutdown();
            // testProcess is undefined `shutdown` won't exit the process, so we exit with non-zero error code
            process.exit(exitCode);
        }
    }
}).catch(err => {
    console.log('Could not start Hazelcast Remote Controller due to an error:');
    throw err;
});
