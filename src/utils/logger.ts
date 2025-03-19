/**
 * Simple logger utility that includes timestamps and file information
 */
export class Logger {
  private startTime: number;
  private filename: string;

  constructor(filename: string) {
    this.startTime = performance.now();
    this.filename = filename;
  }

  /**
   * Log a message with timing information
   * @param message The message to log
   */
  log(message: string): void {
    const currentTime = performance.now();
    const elapsedSeconds = ((currentTime - this.startTime) / 1000).toFixed(2);
    console.log(`[${elapsedSeconds}s] [${this.filename}] ${message}`);
  }

  /**
   * Log an error with timing information
   * @param message The error message to log
   * @param error Optional error object
   */
  error(message: string, error?: any): void {
    const currentTime = performance.now();
    const elapsedSeconds = ((currentTime - this.startTime) / 1000).toFixed(2);
    console.error(`[${elapsedSeconds}s] [${this.filename}] ERROR: ${message}`, error || '');
  }

  /**
   * Log a warning with timing information
   * @param message The warning message to log
   */
  warn(message: string): void {
    const currentTime = performance.now();
    const elapsedSeconds = ((currentTime - this.startTime) / 1000).toFixed(2);
    console.warn(`[${elapsedSeconds}s] [${this.filename}] WARNING: ${message}`);
  }

  /**
   * Reset the start time for the logger
   */
  resetTimer(): void {
    this.startTime = performance.now();
  }
}

/**
 * Create a new logger instance
 * @param filename The filename to include in logs
 * @returns A new Logger instance
 */
export const createLogger = (filename: string): Logger => {
  return new Logger(filename);
}; 