import { TokenCredentials, UsernamePasswordCredentials } from '../security';
/**
 * Contains configuration for the client to use different kinds
 * of credential types during authentication, such as username/password,
 * token, or custom credentials.
 */
export interface SecurityConfig {
    /**
     * Credentials to be used with username and password authentication.
     */
    usernamePassword?: UsernamePasswordCredentials;
    /**
     * Credentials to be used with token-based authentication.
     */
    token?: TokenCredentials;
    /**
     * Credentials to be used with custom authentication.
     */
    custom?: any;
}
