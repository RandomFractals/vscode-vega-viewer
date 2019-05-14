export class Logger {
  constructor(private category:string, private logLevel = LogLevel.Debug) {
  }

  public logMessage(logLevel:LogLevel, message:string, params:any = null): void{
    console.log(this.category + message, params);
    if (logLevel >= this.logLevel) {
      this.log(logLevel, message, params);
    }
  }

  private log(logLevel:LogLevel, message:string, params:any = null): void {
    switch (logLevel) {
      case LogLevel.Warn:
        console.warn(this.category + message, params);
        break;
      case LogLevel.Info:
        console.info(this.category + message, params);
        break;
      case LogLevel.Error:
        console.error(this.category + message, params);
        break;
      default: // debug
        console.debug(this.category + message, params);
    }
  }

}

export enum LogLevel {
  Debug = 0,
  Warn = 1,
  Info = 2,
  Error = 3
}
