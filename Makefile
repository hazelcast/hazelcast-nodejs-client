.PHONY: build lint test test-all

build:
	npm run compile

lint:
	npm lint

test: build lint
	npm test

test-all: build lint
	env HAZELCAST_ENTERPRISE_KEY=1 npm test

