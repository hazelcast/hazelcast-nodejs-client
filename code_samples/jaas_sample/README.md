# JAAS Code Sample

This code sample demonstrates how to assign different permission policies for different user groups with the Hazelcast JAAS based security features.

Users within the `adminGroup` have create, destroy, read and put permissions over the `importantAdminMap`.

Users within the `readerGroup` have just create and read permissions over the `importantReaderMap`.

To test the code sample,

* Make sure [hazelcast.xml](hazelcast-member/src/main/resources/hazelcast.xml) is in your class path.

* Start the Hazelcast member with [Bootstrap.java](hazelcast-member/src/main/java/com/company/Bootstrap.java).

* Run the [clien.js](client.js) with the command `node client.js`.

You should see an output similar to below.

```
Reader client connected
Admin client connected
Reader can create a map
Admin can create a map
Reader can read from map: null
Admin can read from map: null
Reader cannot put to map. Reason: Error: Class name: java.security.AccessControlException , Message: Permission ("com.hazelcast.security.permission.MapPermission" "importantReaderMap" "put") denied!
Admin can put to map
Value for the "anotherKey" is anotherValue
```
