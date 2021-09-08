# Paging Predicate Example with Sorting

In this example you will learn how you can use a paging predicate with sorting. In order to define how sorting will work,
you need a comparator. In order a member to know this comparator, you need to register the comparator in the member config.
The following describes how to do it:

You can use the sample project in [main](./main) folder:

1. Run the [Main](./main/src/main/java/Main.java) class. The started member will already have the `Comparator` class registered.
2. Run the sample code in main.js via `node main.js`.

Alternatively, you can start from scratch:

1. Download Hazelcast. Extract it somewhere. https://hazelcast.com/get-started/download/
2. To add a custom comparator you need to compile and add it to Hazelcast classpath.
3. In order to compile use a Java project that includes Hazelcast as a dependency, you can use an IDE like Intellij IDEA
for simplicity. Just open the IDE and press build button, then the classes will be in `target` folder.
The Java project used is in the `main` folder.
4. Put compiled Java classes inside `bin/user-lib` in extracted Hazelcast folder. By default, the Hazelcast member will look for
classes inside `bin/user-lib` directory. In other words that directory is in member's CLASSPATH.
5. You can also find the compiled classes in `user-lib` folder in this folder in case you need them.
6. Register identified data serializable in `bin/hazelcast.xml` config. There is a `hazelcast.xml` you can copy,
or just copy the related part in serialization config.
7. Navigate to folder that you extracted Hazelcast to.
8. Run `chmod +x bin/start.sh` if the file is not executable.
9. Run Hazelcast with `bin/start.sh`.
10. Run the sample code in main.js via `node main.js`.
