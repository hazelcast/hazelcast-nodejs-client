# Simple benchmark for Hazelcast IMDG Node.js Client

A simple benchmark that runs operations on `Map` concurrently, measures the execution time and calculates the throughput:
* `put` - runs `map.put('foo', 'bar')` operations.
* `get` - runs `map.get` operations that read string value with >100 KB size.
* `random` - runs randomly selected operations (`get`, `put`, `remove`).

## Running the benchmark

First, install dependencies and build the client:
```bash
npm install
```

Then, build the client (compile TypeScript):
```bash
npm run compile
```

Next, run at least one instance of IMDG. The most simple way to do it would be to use the [official Docker image](https://hub.docker.com/r/hazelcast/hazelcast/):
```bash
docker run -p 5701:5701 hazelcast/hazelcast:4.0.2
```

Finally, run one of the benchmarks, e.g.:
```bash
node benchmark/Benchmark.js put
```

You can also override the total number of operations (`-t` argument) and the concurrency level (`-c` argument) for the benchmark:
```bash
node benchmark/Benchmark.js put -t 3000000 -c 256
```

The benchmark will run and produce its results into the console:
```bash
Benchmark type: put
Value size: 1024
Starting warm-up for 300000 operations
Warm-up finished
Took 18.345385751 seconds for 3000000 operations
Ops/s: 163528.85901221627
Benchmark finished
```
