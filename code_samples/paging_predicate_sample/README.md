# Paging Predicate Example with Sorting

In this example you will learn how you can use a paging predicate with sorting. In order to define how sorting will work,
you need a comparator. In order to a member to know this comparator, you need to register the comparator in the member config.
The following describes how to do it:

You can use the sample project in [main](./main) folder:

1. Run the [Main](./main/src/main/java/Main.java) class. The started member will already have the `Comparator` class registered.
2. Run the sample code in main.js via `node main.js`.

Alternatively, you can start from scratch:

1. Download hazelcast. Extract it somewhere. https://hazelcast.org/imdg/download/
2. To add a custom comparator you need to compile and add it to hazelcast classpath.
3. In order to compile use a java project that includes hazelcast as a dependency, you can use an IDE like Intellij for simplicity. Just open the IDE and press build button, then the classes will be in `target` folder. The java project used is in the `main` folder.
4. Put compiled java classes inside `bin/user-lib` in extracted hazelcast folder. By default, the hazelcast member will look for classes inside `bin/user-lib` directory. In other words that directory is in member's CLASSPATH.
5. You can also find the compiled classes in `user-lib` folder in this folder in case you need them.
6. Register identified data serializable in `bin/hazelcast.xml` config. There is a `hazelcast.xml` you can copy, or just copy the related part in serialization config.
7. Navigate to folder that you extracted hazelcast to.
8. Run `chmod +x bin/start.sh` if the file is not executable.
9. Run hazelcast with `bin/start.sh`.
10. Run the sample code in main.js via `node main.js`.
