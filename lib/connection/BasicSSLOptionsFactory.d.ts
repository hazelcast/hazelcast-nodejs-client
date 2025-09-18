import { Properties } from '../config/Properties';
import { SSLOptionsFactory } from './SSLOptionsFactory';
/**
 * Default implementation of {@link SSLOptionsFactory}.
 */
export declare class BasicSSLOptionsFactory implements SSLOptionsFactory {
    private servername;
    private rejectUnauthorized;
    private ca;
    private key;
    private cert;
    private ciphers;
    init(properties: Properties): Promise<void>;
    getSSLOptions(): any;
}
