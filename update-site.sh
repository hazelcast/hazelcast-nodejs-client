#!/usr/bin/env bash

wget https://raw.githubusercontent.com/hazelcast/hazelcast-nodejs-client/master/README.md
touch "_source/index.md"
printf '%s\n%s\n%s\n' '---' 'layout: home' '---' >> _source/index.md
cat README.md >> _source/index.md
cd _source
jekyll build
cp -r _site/assets ../assets
cp _site/index.html ../index.html
rm index.md
rm ../README.md
