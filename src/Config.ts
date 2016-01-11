const DEFAULT_GROUP_NAME = 'dev';
const DEFAULT_GROUP_PASSWORD = 'dev-pass';

export class GroupConfig {
    name: string = DEFAULT_GROUP_NAME;
    password: string = DEFAULT_GROUP_PASSWORD;
}

export class SocketOptions {
    //TO-DO
}

export class ClientNetworkConfig {
    addresses: string[];
    connectionAttemptLimit: number = 2;
    connectionAttemptPeriod: number = 3000;
    connectionTimeout: number = 5000;
    redoOperation: boolean = false;
    smartRouting: boolean = false;
    socketOptions: SocketOptions = new SocketOptions();
}

export class SerializationConfig {
    //TO-DO when implementing serialization
}

export class GlobalSerializerConfig {
    //TO-DO when implementing serialization
}

export class ListenerConfig {
    //TO-DO
}

export class ClientConfig {
    instanceName: string;
    properties = {};
    groupConfig: GroupConfig = new GroupConfig();
    networkConfig: ClientNetworkConfig = new ClientNetworkConfig();
    listenerConfigs: ListenerConfig[];
    serializationConfig: SerializationConfig = new SerializationConfig();
}
