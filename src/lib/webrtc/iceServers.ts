/** Default STUN for NAT traversal; add TURN via env if your deployment requires it. */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function getRtcConfiguration(): RTCConfiguration {
  const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
  if (raw && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as RTCIceServer[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { iceServers: parsed };
      }
    } catch {
      /* use defaults */
    }
  }
  return { iceServers: DEFAULT_ICE_SERVERS };
}
