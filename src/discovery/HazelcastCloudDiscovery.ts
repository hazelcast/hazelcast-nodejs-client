import Address = require('../Address');
import {createAddressFromString} from '../Util';
import {get} from 'https';
import {IncomingMessage} from 'http';
import * as Promise from 'bluebird';
import {Properties} from '../config/Properties';
import * as URL from 'url';

/**
 * Discovery service that discover nodes via hazelcast.cloud
 * https://coordinator.hazelcast.cloud/cluster/discovery?token=<TOKEN>
 */
export class HazelcastCloudDiscovery {
    /**
     * Internal client property to change base url of cloud discovery endpoint.
     * Used for testing cloud discovery.
     */
    private static readonly CLOUD_URL_BASE_PROPERTY = 'hazelcast.client.cloud.url';
    private static readonly CLOUD_URL_PATH = '/cluster/discovery?token=';
    private static readonly PRIVATE_ADDRESS_PROPERTY = 'private-address';
    private static readonly PUBLIC_ADDRESS_PROPERTY = 'public-address';

    private readonly endpointUrl: string;
    private readonly connectionTimeoutInMillis: number;

    constructor(endpointUrl: string, connectionTimeoutInMillis: number) {
        this.endpointUrl = endpointUrl;
        this.connectionTimeoutInMillis = connectionTimeoutInMillis;
    }

    public static createUrlEndpoint(properties: Properties, cloudToken: string): string {
        const cloudBaseUrl = properties[HazelcastCloudDiscovery.CLOUD_URL_BASE_PROPERTY] as string;
        return cloudBaseUrl + this.CLOUD_URL_PATH + cloudToken;
    }

    discoverNodes(): Promise<Map<string, Address>> {
        return this.callService().catch((e) => {
            throw e;
        });
    }

    callService(): Promise<Map<string, Address>> {
        const deferred = Promise.defer<Map<string, Address>>();

        const url = URL.parse(this.endpointUrl);
        const endpointUrlOptions = {
            host: url.host,
            path: url.path,
        };

        let dataAsAString: string = '';
        get(endpointUrlOptions, (res: IncomingMessage) => {
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
