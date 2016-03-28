import {LogLevel, ILogger} from './LoggingService';
class NoLogger implements ILogger {
    log(level: LogLevel, className: string, message: string, furtherInfo: any) {
        /* tslint:disable */
    }
}

export = NoLogger;

