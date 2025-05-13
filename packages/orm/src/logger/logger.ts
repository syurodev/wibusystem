import { LoggerService } from "./logger.interface";

export class Logger implements LoggerService {
  private static instance: Logger;
  private context?: string;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setContext(context: string): void {
    this.context = context;
  }

  private formatMessage(
    level: string,
    message: string,
    args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    const contextPrefix = this.context ? `[${this.context}] ` : "";
    const formattedArgs =
      args.length > 0
        ? ` ${args.map((arg) => JSON.stringify(arg)).join(" ")}`
        : "";
    return `${timestamp} [${level.toUpperCase()}] ${contextPrefix}${message}${formattedArgs}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage("debug", message, args));
  }

  public log(message: string, ...args: unknown[]): void {
    // Thêm phương thức log giống như trong ModelManager
    // eslint-disable-next-line no-console
    console.log(this.formatMessage("log", message, args));
  }

  public info(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage("info", message, args));
  }

  public warn(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage("warn", message, args));
  }

  public error(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage("error", message, args));
  }
}
