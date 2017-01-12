import {Data} from '../serialization/Data';
export interface KeyStateMarker {
    markIfUnmarked(key: Data): boolean;
    unmarkIfMarked(key: Data): boolean;
    removeIfMarked(key: Data): boolean;
    unmarkForcibly(key: Data): void;
    unmarkAllForcibly(): void;

}

enum KeyState {
    UNMARKED = 0,
    MARKED = 1,
    REMOVED = 2
}

export class KeyStateMarkerImpl implements KeyStateMarker {

    private marks: KeyState[];

    constructor(markerCount: number) {
        this.marks = [];
        for (let i = markerCount - 1; i >= 0; i--) {
            this.marks[i] = KeyState.UNMARKED;
        }
    }

    markIfUnmarked(key: Data): boolean {
        return this.compareAndSet(key, KeyState.UNMARKED, KeyState.MARKED);
    }

    unmarkIfMarked(key: Data): boolean {
        return this.compareAndSet(key, KeyState.MARKED, KeyState.UNMARKED);
    }

    removeIfMarked(key: Data): boolean {
        return this.compareAndSet(key, KeyState.MARKED, KeyState.REMOVED);
    }

    unmarkForcibly(key: Data): void {
        let slot = this.getSlot(key);
        this.marks[slot] = KeyState.UNMARKED;
    }

    unmarkAllForcibly(): void {
        for (let i = 0; i < this.marks.length; i++) {
            this.marks[i] = KeyState.UNMARKED;
        }
    }

    private compareAndSet(key: Data, expect: KeyState, update: KeyState): boolean {
        let slot = this.getSlot(key);
        if (this.marks[slot] === expect) {
            this.marks[slot] = update;
            return true;
        } else {
            return false;
        }
    }

    private getSlot(data: Data): number {
        return this.hashToIndex(data.getPartitionHash(), this.marks.length);
    }

    private hashToIndex(hash: number, len: number): number {
        return Math.abs(hash) % len;
    }

}

export class TrueKeyStateMarker implements KeyStateMarker {

    static INSTANCE = new TrueKeyStateMarker();

    private constructor() {
        //Empty method
    }

    markIfUnmarked(key: Data): boolean {
        return true;
    }

    unmarkIfMarked(key: Data): boolean {
        return true;
    }

    removeIfMarked(key: Data): boolean {
        return true;
    }

    unmarkForcibly(key: Data): void {
        //Empty method
    }

    unmarkAllForcibly(): void {
        //Empty method
    }

}
