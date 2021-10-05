Tests in this folder run in parallel. Mocha runs every file as separate Node.js processes. `-j` option of mocha
determines the number of processes that run at the same time. It is by default number of cores - 1. Mocha docs say that
setting it higher is unnecessary but for our case it might be useful. (Hazelcast is IO intensive). GH actions have 2 cores
for linux machines.

For tests run in parallel, port setting in xml(under network) should be set to 0, otherwise parallel execution is not possible
in a fast way. `testFactory.createClusterForParallelTest`'s second argument includes a default configuration that sets it.

Setting port config to 0 means hazelcast will use the port system assigns.

Also, clients should include `network.clusterMembers` in their config to be able to connect to the created members.
