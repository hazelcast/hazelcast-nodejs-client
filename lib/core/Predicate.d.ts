import { IdentifiedDataSerializable } from '../serialization/Serializable';
import { Comparator } from './Comparator';
/**
 * Specifies conditions for entry lookup during iteration over a Map.
 */
export interface Predicate extends IdentifiedDataSerializable {
}
/**
 * This interface is a special Predicate which helps to get a page-by-page
 * result of a query. It can be constructed with a page-size, an inner
 * predicate for filtering, and a comparator for sorting.
 */
export interface PagingPredicate extends Predicate {
    /**
     * Sets the page value to next page.
     */
    nextPage(): PagingPredicate;
    /**
     * Sets the page value to previous page.
     */
    previousPage(): PagingPredicate;
    /**
     * Returns the current page value.
     */
    getPage(): number;
    /**
     * Sets the current page value.
     *
     * @param page page number
     */
    setPage(page: number): PagingPredicate;
    /**
     * Returns the page size.
     */
    getPageSize(): number;
    /**
     * Retrieve the anchor object which is the last value object on the
     * previous page.
     *
     * Note: This method will return "null" anchor on the first page of the query
     * result or if the predicate was not applied for the previous page number.
     */
    getAnchor(): [number, [any, any]];
    /**
     * Returns the comparator used by this predicate (if any).
     */
    getComparator(): Comparator;
}
export declare function sql(str: string): Predicate;
export declare function and(...predicates: Predicate[]): Predicate;
export declare function between(field: string, from: any, to: any): Predicate;
export declare function equal(field: string, value: any): Predicate;
export declare function greaterThan(field: string, value: any): Predicate;
export declare function greaterEqual(field: string, value: any): Predicate;
export declare function lessThan(field: string, value: any): Predicate;
export declare function lessEqual(field: string, value: any): Predicate;
export declare function like(field: string, expr: string): Predicate;
export declare function ilike(field: string, expr: string): Predicate;
export declare function inPredicate(field: string, ...values: any[]): Predicate;
export declare function instanceOf(className: string): Predicate;
export declare function notEqual(field: string, value: any): Predicate;
export declare function not(predicate: Predicate): Predicate;
export declare function or(...predicates: Predicate[]): Predicate;
export declare function regex(field: string, reg: string): Predicate;
export declare function alwaysTrue(): Predicate;
export declare function alwaysFalse(): Predicate;
export declare function paging(predicate: Predicate, pageSize: number, comparator?: Comparator): PagingPredicate;
