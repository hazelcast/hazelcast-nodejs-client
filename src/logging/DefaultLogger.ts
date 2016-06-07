import {LogLevel, ILogger} from './LoggingService';
export class DefaultLogger implements ILogger {
    level = LogLevel.INFO;

    log(level: LogLevel, className: string, message: string, furtherInfo: any) {
        if (level <= this.level) {
            console.log('[DefaultLogger] %s at %s: %s', LogLevel[level], className, message);
            if (furtherInfo != null) {
                console.log(furtherInfo);
            }
        }
    }
}
