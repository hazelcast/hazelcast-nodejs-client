/// <reference types="node" />
import { ConnectionOptions } from 'tls';
import { Properties } from './Properties';
import { SSLOptionsFactory } from '../connection/SSLOptionsFactory';
/**
 * SSL configuration.
 */
export interface SSLConfig {
    /**
     * If it is true, SSL is enabled.
     */
    enabled?: boolean;
    /**
     * Default SSL options are empty which means the following default configuration
     * is used while connecting to the server.
     *
     * ```json
     * {
     *   checkServerIdentity: (): any => null,
     *   rejectUnauthorized: true,
     * };
     * ```
     *
     * If you want to override the default behavior, you can define your own options.
     */
    sslOptions?: ConnectionOptions;
    /**
     * SSL options factory. If you don't specify it, BasicSSLOptionsFactory is used by default.
     */
    sslOptionsFactory?: SSLOptionsFactory;
    /**
     * The properties to be set for SSL options.
     */
    sslOptionsFactoryProperties?: Properties;
}
