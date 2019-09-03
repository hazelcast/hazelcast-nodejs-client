import {StackTraceElement} from './StackTraceElement';
import {Frame} from '../ClientMessage';

export class ErrorHolder {

    public errorCode: number;
    public className: string;
    public message: string;
    public stackTraceElements: StackTraceElement[];

    constructor(errorCode: number, className: string, message: string, stackTraceElements: StackTraceElement[]) {
        this.errorCode = errorCode;
        this.className = className;
        this.message = message;
        this.stackTraceElements = stackTraceElements;
    }

    public static fastForwardToEndFrame(frame: Frame): void {
        while (frame.next) {
            frame = frame.next;
        }
    }

    public getErrorCode(): number {
        return this.errorCode;
    }

    public getClassName(): string {
        return this.className;
    }

    public getMessage(): string {
        return this.message;
    }

    public getStackTraceElements(): StackTraceElement[] {
        return this.stackTraceElements;
    }

}
