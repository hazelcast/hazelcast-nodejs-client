'use strict';
const fs = require('fs');
const os = require('os');
const net = require('net');
const {spawnSync, spawn} = require('child_process');
const rcParams = require('./rc-params');

const ON_WINDOWS = os.platform() === 'win32';
const HAZELCAST_ENTERPRISE_KEY = process.env.HAZELCAST_ENTERPRISE_KEY ? process.env.HAZELCAST_ENTERPRISE_KEY : '';
const PATH_SEPARATOR = ON_WINDOWS ? ';' : ':';

let testCommand;
let testType;
let rcProcess;
let testProcess;
let CLASSPATH = `hazelcast-remote-controller-${rcParams.HAZELCAST_RC_VERSION}.jar${PATH_SEPARATOR}`
              + `hazelcast-${rcParams.HAZELCAST_TEST_VERSION}-tests.jar${PATH_SEPARATOR}`
              + 'test/javaclasses';

if (HAZELCAST_ENTERPRISE_KEY) {
    CLASSPATH = `hazelcast-enterprise-${rcParams.HAZELCAST_ENTERPRISE_VERSION}.jar${PATH_SEPARATOR}`
              + `hazelcast-enterprise-${rcParams.HAZELCAST_ENTERPRISE_TEST_VERSION}-tests.jar${PATH_SEPARATOR}`
              + CLASSPATH;
} else {
    CLASSPATH = `hazelcast-${rcParams.HAZELCAST_VERSION}.jar${PATH_SEPARATOR}${CLASSPATH}`;
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
            rcProcess = spawn(
                'start /min "hazelcast-remote-controller" cmd /c '
              + `java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} -cp ${CLASSPATH} `
              + 'com.hazelcast.remotecontroller.Main --use-simple-server > rc_stdout.txt 2> rc_stderr.txt', [], {
                stdio: 'ignore',
                shell: true
            });
        } else {
            try {
                const outFD = fs.openSync('rc_stdout.txt', 'w');
                const errFD = fs.openSync('rc_stderr.txt', 'w');
                rcProcess = spawn('java', [
                    `-Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY}`,
                    '-cp',
                    CLASSPATH,
                    'com.hazelcast.remotecontroller.Main',
                    '--use-simple-server'
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
            } catch (err) {
                throw err;
            }
        }
    } else {
        if (background) {
            rcProcess = spawn(
                  `nohup java -Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY} `
                + `-cp ${CLASSPATH} com.hazelcast.remotecontroller.Main --use-simple-server > rc_stdout.log `
                + '2> rc_stderr.log &', [], {
                stdio: 'ignore',
                shell: true
            });
        } else {
            try {
                const outFD = fs.openSync('rc_stdout.log', 'w');
                const errFD = fs.openSync('rc_stderr.log', 'w');
                rcProcess = spawn('java', [
                    `-Dhazelcast.enterprise.license.key=${HAZELCAST_ENTERPRISE_KEY}`,
                    '-cp',
                    CLASSPATH,
                    'com.hazelcast.remotecontroller.Main',
                    '--use-simple-server'
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
            } catch (err) {
                throw err;
            }
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
    throw `Could not reach to 127.0.0.1:9701 after trying ${retryCount} times.`;
}
const shutdownProcesses = () => {
    console.log('Stopping remote controller and test processes...');
    shutdownRC();
    if (testProcess && testProcess.exitCode === null) testProcess.kill('SIGKILL');
};
const shutdownRC = () => {
    if (rcProcess && rcProcess.exitCode === null) rcProcess.kill('SIGKILL');
}

if (process.argv.length === 3) {
    if (process.argv[2] === 'unit') {
        testCommand = 'node node_modules/mocha/bin/mocha "test/unit/**/*.js"';
        testType = 'unit';
    } else if (process.argv[2] === 'integration') {
        testCommand = 'node node_modules/mocha/bin/mocha "test/integration/**/*.js"';
        testType = 'integration';
    } else if (process.argv[2] === 'alltests') {
        testCommand = 'node node_modules/mocha/bin/mocha "test/**/*.js"';
        testType = 'alltests';
    } else if (process.argv[2] === 'startrc') {
        startRC(true).then(() => {
            console.log('Hazelcast Remote Controller is started!');
            process.exit(0);
        }).catch(err => {
            console.log('Could not start Hazelcast Remote Controller due to an error:');
            throw err;
        });
    } else if (process.argv[2] === 'coverage') {
        testCommand = 'node node_modules/nyc/bin/nyc node_modules/mocha/bin/_mocha "test/**/*.js" -- '
                    + '--reporter-options mochaFile=report.xml --reporter mocha-junit-reporter';
        testType = 'coverage';
    } else {
        throw 'Operation type can be one of "unit", "integration", "alltests", "startrc"';
    }
} else {
    throw 'Usage: node <script-file> <operation-type>. '
        + 'Operation type can be one of "unit", "integration", "alltests", "startrc", "coverage"';
}

if (!fs.existsSync('./lib')) {
    console.log('./lib folder does not exist, so compiling...');
    spawnSync('npm run compile', [], {
        stdio: 'inherit',
        shell: true
    });
}

if (testType === 'unit') {
    console.log(`Running unit tests... Test command: ${testCommand}`);
    spawnSync(testCommand, [], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
    });
    process.exit(0);
}

process.on('SIGINT', shutdownProcesses);
process.on('SIGTERM', shutdownProcesses);
process.on('SIGHUP', shutdownProcesses);

startRC(false).then(() => {
    console.log('Hazelcast Remote Controller is started!');
    console.log(`Running tests... Test type: ${testType}, Test command: ${testCommand}`);
    testProcess = spawn(testCommand, [], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
    });
    testProcess.on('exit', shutdownRC);
}).catch(err => {
    console.log('Could not start Hazelcast Remote Controller due to an error:');
    throw err;
});
