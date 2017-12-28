import {MemberSelector} from './MemberSelector';
import {Member} from './Member';

export class DataMemberSelector implements MemberSelector {
    select(member: Member): boolean {
        return !member.isLiteMember;
    }
}

export class MemberSelectors {
    static readonly DATA_MEMBER_SELECTOR = new DataMemberSelector();
}
