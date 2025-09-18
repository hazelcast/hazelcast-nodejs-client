'use strict';
const HZ_VERSION = '5.4.0';
const HZ_TEST_VERSION = '5.4.0';
const HAZELCAST_TEST_VERSION = HZ_TEST_VERSION;
const HAZELCAST_VERSION = HZ_VERSION;
const HAZELCAST_ENTERPRISE_VERSION = HZ_VERSION;
const HAZELCAST_RC_VERSION = '0.8-SNAPSHOT';
const SNAPSHOT_REPO = 'https://oss.sonatype.org/content/repositories/snapshots';
const RELEASE_REPO = 'https://repo.maven.apache.org/maven2';
const ENTERPRISE_RELEASE_REPO = 'https://repository.hazelcast.com/release/';
const ENTERPRISE_SNAPSHOT_REPO = 'https://repository.hazelcast.com/snapshot/';

const downloadRC = () => {
    const fs = require('fs');
    const os = require('os');
    const {spawnSync} = require('child_process');

    let REPO;
    let ENTERPRISE_REPO;
    let TEST_REPO;

    if (HZ_VERSION.endsWith('-SNAPSHOT')) {
        REPO = SNAPSHOT_REPO;
        ENTERPRISE_REPO = ENTERPRISE_SNAPSHOT_REPO;
    } else {
        REPO = RELEASE_REPO;
        ENTERPRISE_REPO = ENTERPRISE_RELEASE_REPO;
    }

    if (HZ_TEST_VERSION.endsWith('-SNAPSHOT')) {
        TEST_REPO = SNAPSHOT_REPO;
    } else {
        TEST_REPO = RELEASE_REPO;
    }

    downloadArtifact(ENTERPRISE_SNAPSHOT_REPO, 'hazelcast-remote-controller', HAZELCAST_RC_VERSION);
    downloadArtifact(TEST_REPO, 'hazelcast', HAZELCAST_TEST_VERSION, 'tests');
    downloadArtifact(REPO, 'hazelcast-sql', HAZELCAST_VERSION);

    if (process.env.HAZELCAST_ENTERPRISE_KEY) {
        downloadArtifact(ENTERPRISE_REPO, 'hazelcast-enterprise', HAZELCAST_ENTERPRISE_VERSION);
    } else {
        downloadArtifact(REPO, 'hazelcast', HAZELCAST_VERSION);
    }

    function downloadArtifact(repo, artifactId, version, classifier = '') {
        const filename = classifier ? `${artifactId}-${version}-${classifier}.jar` : `${artifactId}-${version}.jar`;
        let artifact = `com.hazelcast:${artifactId}:${version}:jar`;
        if (classifier) {
            artifact += `:${classifier}`;
        }

        if (fs.existsSync(filename)) {
            console.log('${filename} already exists, download not required');
        } else {
            console.log(`Downloading: ${artifact} to ${filename}`);
            const subprocess = spawnSync('mvn', [
                '-q',
                'org.apache.maven.plugins:maven-dependency-plugin:2.10:get',
                '-Dtransitive=false',
                `-DremoteRepositories=${repo}`,
                `-Dartifact=${artifact}`,
                `-Ddest=hazelcast-${filename}`
            ], {
                stdio: 'inherit',
                shell: os.platform() === 'win32'
            });
            if (subprocess.status !== 0) {
                const subprocessTrace = subprocess.error ? subprocess.error.stack : '';
                throw `Failed to download ${artifact} to ${filename} - ${subprocessTrace}`;
            }
        }
    }
};

module.exports = {
    HAZELCAST_VERSION: HAZELCAST_VERSION,
    HAZELCAST_TEST_VERSION: HAZELCAST_TEST_VERSION,
    HAZELCAST_ENTERPRISE_VERSION: HAZELCAST_ENTERPRISE_VERSION,
    HAZELCAST_RC_VERSION: HAZELCAST_RC_VERSION,
    downloadRC: downloadRC
};
