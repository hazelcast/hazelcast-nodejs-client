# Simple benchmark for Hazelcast Node.js Client

A simple benchmark that runs operations on `Map` concurrently, measures the execution time and calculates the throughput:
* `set` - runs `map.set(key, value)` operations.
* `get` - runs `map.get(key)` operations that read string value with >100 KB size.
* `random` - runs randomly selected operations (`get`, `set`, `delete`).

## Running the benchmark

First, install dependencies and build the client:
```bash
npm install
```

Then, build the client (compile TypeScript):
```bash
npm run compile
```

Next, run at least one instance of Hazelcast. The most simple way to do it would be to use the
[official Docker image](https://hub.docker.com/r/hazelcast/hazelcast/):
```bash
docker run --net=host hazelcast/hazelcast:4.1.1
```

Note: it's important to use host network when benchmarking to avoid the
[overhead](https://github.com/hazelcast/hazelcast-docker/issues/165#issuecomment-725901950) introduced by Docker's NAT.

Finally, run one of the benchmarks, e.g.:
```bash
node benchmark/Benchmark.js set
```

You can also override the total number of operations (`-t` argument) and the concurrency level (`-c` argument) for the benchmark:
```bash
node benchmark/Benchmark.js set -t 3000000 -c 256
```

The benchmark will run and produce its results into the console:
```bash
Benchmark type: set
Value size: 1024
Starting warm-up with 300000 operations
Warm-up finished
Took 38.000682676 seconds for 3000000 operations
Ops/s: 78945.95014459314
Benchmark finished
```
