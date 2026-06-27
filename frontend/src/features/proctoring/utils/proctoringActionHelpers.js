const PROCTOR_ACTION_META = {

  START_LIVE_WATCH: { label: "Bắt đầu xem live" },

  STOP_LIVE_WATCH: { label: "Dừng xem live" },

  CAPTURE_SNAPSHOT: { label: "Thực hiện chụp ảnh" },

  START_RECORD_CLIP: { label: "Bắt đầu Record" },

  RECORD_CLIP: { label: "Hoàn thành Record màn hình" },

  MUTE_AUDIO: { label: "Tắt mic" },

  UNMUTE_AUDIO: { label: "Bật mic" },

  MOVE_TO_WAITING_ROOM: { label: "Tạm dừng thi" },

  RESUME_ATTEMPT: { label: "Cho tiếp tục thi" },

  TERMINATE_ATTEMPT: { label: "Kết thúc bài làm" },

  WARN_STUDENT: { label: "Thực hiện nhắc nhở" },

};



function parseDurationSeconds(reason) {

  if (!reason) {

    return null;

  }



  const match = reason.match(/(\d+)\s*giây/);

  return match ? Number(match[1]) : null;

}



export function getProctorActionMeta(actionType) {

  return (

    PROCTOR_ACTION_META[actionType] ?? {

      label: actionType || "Thao tác giám sát",

    }

  );

}



export function formatTimelineActionDisplay(action) {

  const meta = getProctorActionMeta(action.actionType);

  const reason = action.reason?.trim() || null;



  if (action.actionType === "RECORD_CLIP") {

    const seconds = parseDurationSeconds(reason);

    if (seconds !== null) {

      return {

        label: `Record màn hình ${seconds} giây`,

        reason: null,

      };

    }



    return { label: meta.label, reason };

  }



  if (action.actionType === "CAPTURE_SNAPSHOT") {

    return { label: meta.label, reason: null };

  }



  if (action.actionType === "START_RECORD_CLIP") {

    return { label: meta.label, reason: null };

  }



  if (action.actionType === "MUTE_AUDIO" || action.actionType === "UNMUTE_AUDIO") {

    return { label: meta.label, reason: null };

  }



  return { label: meta.label, reason };

}


