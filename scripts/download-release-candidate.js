/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const axios = require('axios');
const yargs = require('yargs');
const fs = require('fs');
const argv = yargs
    .usage('$0 [options]', 'This script will download the latest release candidate using Github API given the' +
        'branch name, a username and a personal access token.')
    .string('b')
    .describe('b', 'The branch name of the form "5.0.x" to fetch the release candidate.')
    .string('u')
    .describe('u', 'Github username')
    .string('p')
    .describe('p', 'The personal access token associated with the given github username that can access hazelcast/' +
        'hazelcast-nodejs-client\'s repo\'s artifacts.')
    .string('o')
    .describe('o', 'Output path. The output file will be in zip format.')
    .default('o', 'release-candidate.zip')
    .help('h')
    .alias('h', 'help')
    .argv;

const branchName = argv.b;
const username = argv.u;
const personalAccessToken = argv.p;
const outputPath = argv.o;

const baseURL = 'https://api.github.com/repos/hazelcast/hazelcast-nodejs-client';

async function findLatestCommitOfBranch(branchName) {
    const res = await axios.get(`${baseURL}/commits/${branchName}`);
    console.log(`Latest commit of branch ${branchName} with sha ${res.data.sha} is`, res.data.commit);
    return res.data.sha;
}

async function findLatestValidArtifact(commitSha) {
    const res = await axios.get(`${baseURL}/actions/artifacts`);
    if (!res.data || !res.data.artifacts || !Array.isArray(res.data.artifacts)) {
        console.error('Unexpected response while finding latest valid artifact', res);
        process.exit(1);
    }
    const artifacts = res.data.artifacts;

    let latestValidArtifact;

    try {
        for (const artifact of artifacts) {
            // The release pack we are looking for
            if (artifact.name === `release-pack-${commitSha}`) {
                if (latestValidArtifact === undefined) {
                    latestValidArtifact = artifact;
                    continue;
                }
                // Assign only if the found one is created newer.
                if (new Date(latestValidArtifact.created_at) <= new Date(artifact.created_at)) {
                    latestValidArtifact = artifact;
                }
            }
        }
    } catch (e) {
        console.error('Unexpected artifact object(s) while finding latest valid artifact of the commit', artifacts, e);
        process.exit(1);
    }

    // Could not find any valid artifact, exit
    if (latestValidArtifact === undefined) {
        console.error(`Could not find any valid artifact for the commit ${commitSha}` +
            ` which is the latest commit of the given branch ${branchName}`);
        process.exit(1);
    }

    console.log('The latest valid artifact to be downloaded is ', latestValidArtifact);
    return latestValidArtifact;
}

async function downloadArtifact(latestValidArtifact) {
    // Axios follows the url in the location header to download the artifact.
    const res = await axios.get(`${baseURL}/actions/artifacts/${latestValidArtifact.id}/zip`, {
        auth: {
            username: username,
            password: personalAccessToken
        },
        responseType: 'arraybuffer'
    });

    if (!(res.data instanceof Buffer)) {
        console.error('Full response: ', res);
        console.error('Unexpected response to download artifact request, expected a binary file, got ', res.data);
        process.exit(1);
    }

    if (fs.existsSync(outputPath)) {
        console.error(`The path ${outputPath} already exists.`);
        process.exit(1);
    }

    fs.writeFileSync(outputPath, res.data);
}

async function main() {
    let commitSha;
    try {
        commitSha = await findLatestCommitOfBranch(branchName);
    } catch (e) {
        console.error(`Could not find the latest commit of the branch ${branchName}`, e);
        process.exit(1);
    }
    const latestValidArtifact = await findLatestValidArtifact(commitSha);
    try {
        await downloadArtifact(latestValidArtifact);
    } catch (e) {
        console.error('Error while downloading the artifact', e);
        process.exit(1);
    }
}

main().catch(console.error);
