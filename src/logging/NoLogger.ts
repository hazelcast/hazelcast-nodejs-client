import {LogLevel, ILogger} from './LoggingService';
export class NoLogger implements ILogger {
    log(level: LogLevel, className: string, message: string, furtherInfo: any) {
        /* tslint:disable */
    }
}
