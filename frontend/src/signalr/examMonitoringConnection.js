import { createSignalRConnection } from "./signalrConnection";

export const EXAM_MONITORING_EVENTS = {
  receiveAntiCheatWarning: "ReceiveAntiCheatWarning",
  receiveProctoringWarning: "ReceiveProctoringWarning",
  teacherRequestedWatch: "TeacherRequestedWatch",
  teacherStoppedWatch: "TeacherStoppedWatch",
  receiveWebRtcOffer: "ReceiveWebRtcOffer",
  receiveWebRtcAnswer: "ReceiveWebRtcAnswer",
  receiveIceCandidate: "ReceiveIceCandidate",
  liveStreamConnected: "LiveStreamConnected",
  liveStreamStopped: "LiveStreamStopped",
  liveStreamFailed: "LiveStreamFailed",
  studentWarnedByTeacher: "StudentWarnedByTeacher",
  studentMovedToWaitingRoom: "StudentMovedToWaitingRoom",
  studentAttemptResumed: "StudentAttemptResumed",
  studentAttemptTerminated: "StudentAttemptTerminated",
};

export const EXAM_MONITORING_METHODS = {
  joinExam: "JoinExam",
  leaveExam: "LeaveExam",
  studentJoinAttemptStream: "StudentJoinAttemptStream",
  teacherRequestWatch: "TeacherRequestWatch",
  teacherStopWatch: "TeacherStopWatch",
  sendOffer: "SendOffer",
  sendAnswer: "SendAnswer",
  sendIceCandidate: "SendIceCandidate",
};

export function createExamMonitoringConnection() {
  return createSignalRConnection("exam-monitoring");
}
