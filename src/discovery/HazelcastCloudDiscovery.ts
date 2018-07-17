import Address = require('../Address');
import {createAddressFromString} from '../Util';
import {get} from 'https';
import {IncomingMessage} from 'http';
import * as Promise from 'bluebird';

/**
 * Discovery service that discover nodes via hazelcast.cloud
 * https://coordinator.hazelcast.cloud/cluster/discovery?token=<TOKEN>
 */
export class HazelcastCloudDiscovery {
    private static readonly HOST = 'coordinator.hazelcast.cloud';
    private static readonly PATH = '/cluster/discovery?token=';
    private static readonly PRIVATE_ADDRESS_PROPERTY = 'private-address';
    private static readonly PUBLIC_ADDRESS_PROPERTY = 'public-address';

    private readonly endpointUrl: string;
    private readonly connectionTimeoutInMillis: number;

    constructor(cloudToken: string, connectionTimeoutInMillis: number) {
        this.endpointUrl = HazelcastCloudDiscovery.PATH + cloudToken;
        this.connectionTimeoutInMillis = connectionTimeoutInMillis;
    }

    discoverNodes(): Promise<Map<string, Address>> {
        return this.callService().catch((e) => {
            throw e;
        });
    }

    callService(): Promise<Map<string, Address>> {
        const deferred = Promise.defer<Map<string, Address>>();
        let dataAsAString: string = '';

        const options = {
            host: HazelcastCloudDiscovery.HOST,
            path: this.endpointUrl,
        };

        get(options, (res: IncomingMessage) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                dataAsAString += chunk;
            });

            res.on('end', () => {
                deferred.resolve(this.parseResponse(dataAsAString));
            });
        }).on('error', (e) => {
            deferred.reject(e);
        });

        return deferred.promise;
    }

    private parseResponse(data: string): Map<string, Address> {
        const jsonValue = JSON.parse(data);

        const privateToPublicAddresses: Map<string, Address> = new Map<string, Address>();
        for (const value of jsonValue) {
            const privateAddress = value[HazelcastCloudDiscovery.PRIVATE_ADDRESS_PROPERTY];
            const publicAddress = value[HazelcastCloudDiscovery.PUBLIC_ADDRESS_PROPERTY];

            const publicAddr = createAddressFromString(publicAddress.toString());
            privateToPublicAddresses.set(new Address(privateAddress, publicAddr.port).toString(), publicAddr);
        }

        return privateToPublicAddresses;
    }
}
