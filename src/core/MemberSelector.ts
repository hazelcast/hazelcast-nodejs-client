import {Member} from './Member';

export interface MemberSelector {
    select(member: Member): boolean;
}
