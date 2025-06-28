import fs from "fs";
import path from "path";

const logDir = path.resolve(process.cwd(), "listenerLogs");

// Ensure directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Generate timestamped log file name: e.g., "2025-06-14_12-00-00.log"
const now = new Date();
const dateStr = now.toISOString().split("T")[0];
const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // "12-00-00"
const logFileName = `${dateStr}_${timeStr}.log`;
const logPath = path.join(logDir, logFileName);
const logStream = fs.createWriteStream(logPath, { flags: "a" });

function logToFile(type: "log" | "error", ...args: any[]) {
  const time = new Date().toISOString();
  const message = `[${time}] [${type.toUpperCase()}] ${args.map(String).join(" ")}\n`;

  logStream.write(message);

  // Also output to console
  // if (type === "log") console.log(...args);
  // else console.error(...args);
}

export const fileSystemLogger = {
  log: (...args: any[]) => logToFile("log", ...args),
  error: (...args: any[]) => logToFile("error", ...args),
};
