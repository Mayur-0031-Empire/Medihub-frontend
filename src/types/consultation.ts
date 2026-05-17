export interface ConsultationJoinAck {
  ok?: boolean;
  roomName?: string;
  socketId?: string;
  message?: string;
}

export interface WebRtcOfferPayload {
  appointmentId: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRtcAnswerPayload {
  appointmentId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRtcIcePayload {
  appointmentId: string;
  candidate: RTCIceCandidateInit;
}

export type ConsultationConnectionStatus =
  | "idle"
  | "connecting"
  | "joined"
  | "calling"
  | "connected"
  | "disconnected"
  | "error";
