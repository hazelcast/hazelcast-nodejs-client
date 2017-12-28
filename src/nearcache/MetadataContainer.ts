import * as Long from 'long';
import {UUID} from '../core/UUID';

export class MetadataContainer {
    private sequence: Long = Long.fromNumber(0);
    private staleSequence: Long = Long.fromNumber(0);
    private missedSequenceCount: Long = Long.fromNumber(0);
    private uuid: UUID;

    reset(): void {
        this.sequence = Long.fromNumber(0);
        this.staleSequence = Long.fromNumber(0);
        this.missedSequenceCount = Long.fromNumber(0);
    }

    setSequence(sequence: Long): void {
        this.sequence = sequence;
    }

    getSequence(): Long {
        return this.sequence;
    }

    setStaleSequence(staleSequence: Long): void {
        this.staleSequence = staleSequence;
    }

    getStaleSequence(): Long {
        return this.staleSequence;
    }

    increaseMissedSequenceCount(missed: Long): void {
        this.missedSequenceCount = this.missedSequenceCount.add(missed);
    }

    getMissedSequenceCount(): Long {
        return this.missedSequenceCount;
    }

    setUuid(uuid: UUID) {
        this.uuid = uuid;
    }

    getUuid(): UUID {
        return this.uuid;
    }
}
