import { createSignalRConnection } from "./signalrConnection";

export const EXAM_MONITORING_EVENTS = {
  receiveAntiCheatWarning: "ReceiveAntiCheatWarning",
};

export const EXAM_MONITORING_METHODS = {
  joinExam: "JoinExam",
  leaveExam: "LeaveExam",
};

export function createExamMonitoringConnection() {
  return createSignalRConnection("exam-monitoring");
}
