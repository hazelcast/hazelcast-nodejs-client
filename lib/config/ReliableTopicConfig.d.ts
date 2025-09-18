import { TopicOverloadPolicy } from '../proxy';
/**
 * Configuration to be used by the client for the specified ReliableTopic.
 */
export interface ReliableTopicConfig {
    /**
     * Minimum number of messages that Reliable Topic tries to read in batches. By default, set to `10`.
     */
    readBatchSize?: number;
    /**
     * Policy to handle an overloaded topic. Available values are `DISCARD_OLDEST`,
     * `DISCARD_NEWEST`, `BLOCK` and `ERROR`. By default, set to `BLOCK`.
     */
    overloadPolicy?: TopicOverloadPolicy;
}
