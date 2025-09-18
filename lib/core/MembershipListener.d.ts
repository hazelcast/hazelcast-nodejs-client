import { Cluster } from './Cluster';
import { Member } from './Member';
/**
 * Membership event fired when a new member is added to the cluster and/or
 * when a member leaves the cluster or when there is a member attribute change.
 */
export declare class MembershipEvent {
    /**
     * Removed or added member.
     */
    member: Member;
    /**
     * Members list at the moment after this event.
     */
    members: Member[];
}
/**
 * Cluster membership listener. One of {@link memberAdded} or {@link memberRemoved} must exist.
 */
export interface MembershipListener {
    /**
     * Invoked when a new member is added to the cluster.
     *
     * @param {MembershipEvent} event event object
     */
    memberAdded?(event: MembershipEvent): void;
    /**
     * Invoked when an existing member leaves the cluster.
     *
     * @param {MembershipEvent} event event object
     */
    memberRemoved?(event: MembershipEvent): void;
}
/**
 * An event that is sent when a {@link InitialMembershipListener} registers itself on a cluster.
 *
 * @see MembershipListener
 * @see MembershipEvent
 */
export declare class InitialMembershipEvent {
    members: Member[];
    cluster: Cluster;
}
/**
 * The InitialMembershipListener is a {@link MembershipListener} that first
 * receives an {@link InitialMembershipEvent} when it is registered, so it
 * immediately knows which members are available. After that event has
 * been received, it will receive the normal MembershipEvents.
 *
 * When the InitialMembershipListener already is registered on a cluster
 * and is registered again on the same Cluster instance, it will not
 * receive an additional MembershipInitializeEvent. This is a once only event.
 */
export interface InitialMembershipListener extends MembershipListener {
    /**
     * Called when this listener is registered.
     *
     * @param event the MembershipInitializeEvent received when the listener is registered
     */
    init(event: InitialMembershipEvent): void;
}
