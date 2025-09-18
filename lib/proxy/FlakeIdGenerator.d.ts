import * as Long from 'long';
import { DistributedObject } from '../core/DistributedObject';
/**
 * A cluster-wide unique ID generator. Generated IDs are `Long` primitive values
 * and are k-ordered (roughly ordered). IDs are in the range from `0` to `Long.MAX_VALUE`.
 *
 * The IDs contain timestamp component and a node ID component, which is assigned when the member
 * joins the cluster. This allows the IDs to be ordered and unique without any coordination between
 * members, which makes the generator safe even in split-brain scenario.
 *
 * Timestamp component is in milliseconds since 1.1.2018, 0:00 UTC and has 41 bits. This caps
 * the useful lifespan of the generator to little less than 70 years (until ~2088). The sequence component
 * is 6 bits. If more than 64 IDs are requested in single millisecond, IDs will gracefully overflow to the next
 * millisecond and uniqueness is guaranteed in this case. The implementation does not allow overflowing
 * by more than 15 seconds, if IDs are requested at higher rate, the call will block. Note, however, that
 * clients are able to generate even faster because each call goes to a different (random) member, and
 * the 64 IDs/ms limit is for single member.
 *
 * <em>Node ID overflow</em>
 * It is possible to generate IDs on any member or client as long as there is at least one
 * member with join version smaller than 2^16 in the cluster. The remedy is to restart the cluster:
 * nodeId will be assigned from zero again. Uniqueness after the restart will be preserved thanks to
 * the timestamp component.
 */
export interface FlakeIdGenerator extends DistributedObject {
    /**
     * Generates and returns a cluster-wide unique ID.
     *
     * This method goes to a random member and gets a batch of IDs, which will then be returned
     * locally for limited time. The pre-fetch size and the validity time can be configured, see
     * {@link FlakeIdGeneratorConfig}.
     *
     * **Note:** Values returned from this method may not be strictly ordered.
     *
     * @return new cluster-wide unique ID
     *
     * @throws {@link HazelcastError} if node ID for all members in the cluster is out of valid range.
     *      See "Node ID overflow" note above
     * @throws {@link UnsupportedOperationError} if the cluster version is below 3.10
     */
    newId(): Promise<Long>;
}
