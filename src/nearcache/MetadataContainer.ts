export class MetadataContainer {
    private sequence: number;
    private staleSequence: number;
    private missedSequenceCount: number;
    private uuid: string;

    reset(): void {
        this.sequence = 0;
        this.staleSequence = 0;
        this.missedSequenceCount = 0;
    }

    setSequence(sequence: number): void {
        this.sequence = sequence;
    }

    getSequence(): number {
        return this.sequence;
    }

    setStaleSequence(staleSequence: number): void {
        this.staleSequence = staleSequence;
    }

    getStaleSequence(): number {
        return this.staleSequence;
    }

    increaseMissedSequenceCount(missed: number): void {
        this.missedSequenceCount = this.missedSequenceCount + missed;
    }

    getMissedSequenceCount(): number {
        return this.missedSequenceCount;
    }

    setUuid(uuid: string) {
        this.uuid = uuid;
    }

    getUuid(): string {
        return this.uuid;
    }
}
