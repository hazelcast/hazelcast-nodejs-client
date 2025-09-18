import { IndexTypeStrings } from './IndexType';
import { BitmapIndexOptions } from './BitmapIndexOptions';
/**
 * Configuration of an index. Hazelcast support two types of indexes: sorted index and hash index.
 * Sorted indexes could be used with equality and range predicates and have logarithmic search time.
 * Hash indexes could be used with equality predicates and have constant search time assuming the hash
 * function of the indexed field disperses the elements properly.
 *
 * Index could be created on one or more attributes.
 *
 * @see {@link IndexType}
 */
export interface IndexConfig {
    /**
     * Name of the index.
     */
    name?: string;
    /**
     * Type of the index. By default, set to `SORTED`. Available values
     * are `SORTED`, `HASH`, and `BITMAP`.
     */
    type?: IndexTypeStrings;
    /**
     * Indexed attributes.
     */
    attributes?: string[];
    /**
     * Bitmap index options.
     */
    bitmapIndexOptions?: BitmapIndexOptions;
}
