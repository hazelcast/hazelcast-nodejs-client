'use strict';
const fs = require('fs').promises;
const path = require('path');
const { spawnSync } = require('child_process');

// ignored file or folder names
const ignoredNames = [
    'ssl_authentication.js', // needs ssl auth config
    'paging_predicate.js', // needs identified factory registration
    'EntryProcessorSample.js', // needs identified factory registration
    'hazelcast_cloud_discovery.js', // needs a token
    'jaas_sample', // this example is hard to run
    'paging_predicate_sample', // this example is hard to run
    'security', // needs a special server configuration
];

// Recursively walks inside a directory, returning all the JavaScript files inside of it
async function walkJsFiles(dir) {
    let files = await fs.readdir(dir);
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);

        if (ignoredNames.includes(file)) {
            console.log(`Ignoring ${filePath}`);
            return [];
        }

        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            return walkJsFiles(filePath);
        } else if (stats.isFile() && filePath.endsWith('.js')) {
            return filePath;
        } else {
            return [];
        }
    }));

    return files.reduce((all, folderContents) => all.concat(folderContents), []);
}

// remote controller should be running for this script to work
exports.main = async (cluster) => {
    // Import lazily to defer side affect of the import (connection attempt to 9701)
    const RC = require('../test/integration/RC');

    const files = await walkJsFiles(path.join(__dirname, '..', 'code_samples'));
    console.log(`Will run ${JSON.stringify(files)}`);

    const numberOfFiles = files.length;
    let counter = 0;
    for (const file of files) {
        // start and terminate for each code sample to avoid map name clashes
        const member = await RC.startMember(cluster.id);

        console.log(`Running ${file}, ${counter}/${numberOfFiles}`);
        counter++;

        const subprocess = spawnSync('node', [file], {
            stdio: ['ignore', 'inherit', 'pipe'] // redirect stderr and stdout to parent process, ignore stdin
        });

        await RC.terminateMember(cluster.id, member.uuid);

        if (subprocess.status !== 0) {
            throw new Error(`An error occurred while running ${file}: ${subprocess.stderr}`);
        }
    }
};
