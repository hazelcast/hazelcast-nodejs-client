import { Properties } from '../config/Properties';
/**
 * Base interface for built-in and user-provided SSL options factories.
 */
export interface SSLOptionsFactory {
    /**
     * Called during client initialization with the `properties`
     * configuration option passed as the argument.
     *
     * @param properties `properties` configuration option
     */
    init(properties: Properties): Promise<void>;
    /**
     * Called after the client initialization to create the `options`
     * object.
     */
    getSSLOptions(): any;
}
