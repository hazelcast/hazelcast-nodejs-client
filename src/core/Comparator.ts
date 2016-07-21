/**
 * Comparator is used to compare two map entries in a distributed map.
 * A comparator class with the same functionality should be registered
 * on Hazelcast server in order to be used in {PagingPredicate}s.
 *
 */
export interface Comparator {
    /**
     * This method is used to determine order of entries when sorting.
     *  - If return value is a negative value, {a} comes after {b},
     *  - If return value is a positive value, {a} comes before {b},
     *  - If return value is 0, {a} and {b} are indistinguishable in this sorting mechanism.
     *      Their order with respect to each other is undefined.
     * This method must always return the same result given the same pair of keys.
     * @param a first entry
     * @param b second entry
     * @return order index
     * 
     */
    sort(a: [any, any], b: [any, any]): number;
}
