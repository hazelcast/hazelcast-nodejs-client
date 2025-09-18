#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import {pathExistsSync} from 'path-exists';

const cli = meow(`
	Usage
	  $ path-exists <path>

	Example
	  $ path-exists foo && echo "exists" || echo "doesn't exist"
`, {
	importMeta: import.meta,
});

const input = cli.input[0];

if (!input) {
	console.error('Specify a path');
	process.exit(2);
}

process.exit(pathExistsSync(input) ? 0 : 1);
