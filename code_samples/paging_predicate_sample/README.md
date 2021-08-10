# hazelcast-paging-predicate-example

1. Download hazelcast. Extract it somewhere.  https://hazelcast.org/imdg/download/
1. Compile and put java classes inside `bin/user-lib` in extracted hazelcast folder
1. In order to compile I use a java project that includes hazelcast as dependency, and I suggest using an IDE like Intellij. Just open the IDE and press build button, then the classes will be in target folder. I included the java project I used in `main` folder
1. I added compiled classes in `user-lib` folder in this repo in case you need them.
1. Register identified data serializable in bin/hazelcast.xml config, I added hazelcast.xml you can copy it or just copy related part in serialization config
1. chmod +x bin/start.sh if it is not executable
1. Run hazelcast with bin/start.sh
1. Run the sample code in main.js
