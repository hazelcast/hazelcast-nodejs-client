Make sure you have
* [Java 6+](https://www.java.com/en/download/) installed on your system.
* [Hazelcast IMDG Enterprise JAR](https://hazelcast.com/download/) available in your system.

Then, put your Hazelcast IMDG Enterprise license key into the [hazelcast.xml](src/main/resources/hazelcast.xml).

Compile the Java files with the following command:

```
javac -cp /path/to/enterprise/hazelcast-enterprise.jar src/main/java/com/company/security/*.java src/main/java/com/company/Bootstrap.java
```

Finally, run the `Bootstrap` with the following command:

```
java -cp /path/to/enterprise/hazelcast-enterprise.jar:src/main/resources:src/main/java com.company.Bootstrap
```
