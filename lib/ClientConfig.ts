var DEFAULT_GROUP_NAME = "dev";
var DEFAULT_GROUP_PASSWORD = "dev-pass";

class ClientConfig {
    instanceName: string;
    properties = {};
    groupConfig: GroupConfig = new GroupConfig();
    networkConfig: ClientNetworkConfig = new ClientNetworkConfig();
    listenerConfigs: ListenerConfig[];
    serializationConfig: SerializationConfig = new SerializationConfig();
}

class GroupConfig {
    name: string = DEFAULT_GROUP_NAME;
    password: string = DEFAULT_GROUP_PASSWORD;
}

class ClientNetworkConfig {
    addresses: string[];
    connectionAttemptLimit: number = 2;
    connectionAttemptPeriod: number = 3000;
    connectionTimeout: number = 5000;
    redoOperation: boolean = false;
    smartRouting: boolean = false;
    socketOptions: SocketOptions = new SocketOptions();
}

class SerializationConfig {
    //TO-DO when implementing serialization
}

class GlobalSerializerConfig {
    //TO-DO when implementing serialization
}

class SocketOptions {
    //TO-DO
}

class ListenerConfig {
    //TO-DO
}