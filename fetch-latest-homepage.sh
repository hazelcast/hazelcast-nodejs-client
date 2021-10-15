#!/usr/bin/env bash
# Run this every time README.md in master changes

wget https://raw.githubusercontent.com/hazelcast/hazelcast-nodejs-client/master/README.md
touch index.md
printf '%s\n%s\n%s\n' '---' 'layout: home' '---' >> index.md
cat README.md >> index.md
rm README.md