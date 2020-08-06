# Simple benchmark for Hazelcast IMDG Node.js Client

A collection of simple benchmarks that run operations on Map in parallel, measure execution time and calculate throughput:
* `MapPutRunner` - runs `map.put('foo', 'bar')` operations.
* `MapGetRunner` - runs `map.get` operations that read string value with >100 KB size.
* `MapRandomOpRunner` - runs randomly selected operations (`get`, `put`, `remove`).

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
node benchmark/MapPutRunner.js
```

The benchmark will run and produce its results into the console:
```bash
[DefaultLogger] INFO at ConnectionAuthenticator: Connection to 172.17.0.2:5701 authenticated
[DefaultLogger] INFO at ClusterService: Members received.
[ Member {
    address: Address { host: '172.17.0.2', port: 5701, type: 4 },
    uuid: 'ea5ae364-9b0e-438d-bde6-e7592ca21c14',
    isLiteMember: false,
    attributes: {} } ]
[DefaultLogger] INFO at HazelcastClient: Client started
Took 1.058 seconds for 50000 requests
Ops/s: 47258.979206049145
Benchmark finished
```
