import { CompactSerializer } from '../serialization/compact/CompactSerializer';
/**
 * Compact serialization config for the client.
 */
export interface CompactSerializationConfig {
    /**
     * Defines Compact serializers.
     */
    serializers?: Array<CompactSerializer<any>>;
}
