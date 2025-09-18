import { TokenEncoding } from './TokenEncoding';
/**
 * Token-based credentials for custom authentication.
 */
export interface TokenCredentials {
    /**
     * String representation of the encoded form of the
     * token.
     */
    token: string;
    /**
     * Encoding that should be used to decode the token.
     * Defaults to {@link TokenEncoding.ASCII}.
     */
    encoding?: TokenEncoding;
}
