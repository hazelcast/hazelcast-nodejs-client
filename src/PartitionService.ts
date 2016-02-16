import HazelcastClient = require('./HazelcastClient');
class PartitionService {
    private client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getPartitionId(key: any) {
        return Math.abs(this.client.getSerializationService().toData(key).getPartitionHash()) % 271;
    }

}
export = PartitionService;
