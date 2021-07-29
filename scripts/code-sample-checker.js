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
    'jaas_sample' // this example is hard to run
];

// Recursively walks inside a directory, returning all the JavaScript files inside of it
async function walkJsFiles(dir) {
    let files = await fs.readdir(dir);
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (ignoredNames.includes(file)) {
            console.log(`Ignoring ${filePath}`);
            return [];
        }

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

(async () => {
    const files = await walkJsFiles(path.join(__dirname, '..', 'code_samples'));
    console.log(`Will run ${JSON.stringify(files)}`);
    const numberOfFiles = files.length;
    let counter = 0;
    for (const file of files) {
        counter++;
        console.log(`Running ${file}, ${counter}/${numberOfFiles}`);
        const subprocess = spawnSync('node', [file], {
            stdio: ['ignore', 'inherit', 'pipe'] // redirect stderr and stdout to parent process, ignore stdin
        });
        const stderrString = subprocess.stderr.toString().trim();
        if (stderrString) {
            console.error(`An error occurred while running ${file}: ${stderrString}`);
            process.exit(1);
        }
    }
})().catch(async e => {
    console.log(`An error occurred ${e}`);
    process.exit(1);
});
