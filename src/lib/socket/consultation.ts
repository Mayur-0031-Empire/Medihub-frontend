import { resolveSocketConnectionAuth } from "@/lib/auth/ensureAccessToken";
import { resolveConsultationSocketUrl } from "@/lib/config";
import type { ConsultationJoinAck } from "@/types/consultation";
import { io, type Socket } from "socket.io-client";

export async function createConsultationSocket(): Promise<Socket> {
  const url = resolveConsultationSocketUrl();
  const connAuth = await resolveSocketConnectionAuth();

  return io(url, {
    path: "/socket.io",
    withCredentials: true,
    auth: connAuth.kind === "bearer" ? { token: connAuth.token } : undefined,
    // Polling first is more reliable through proxies and slow networks; upgrades to WebSocket when possible.
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 8,
    timeout: 20_000,
  });
}

export function joinConsultationRoom(
  socket: Socket,
  appointmentId: string,
): Promise<ConsultationJoinAck> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Timed out joining the consultation room."));
    }, 15_000);

    socket.emit("consultation:join", { appointmentId }, (ack: ConsultationJoinAck) => {
      window.clearTimeout(timer);
      if (ack?.ok) {
        resolve(ack);
      } else {
        reject(new Error(ack?.message ?? "Could not join consultation room."));
      }
    });
  });
}

export function leaveConsultationRoom(socket: Socket, appointmentId: string): void {
  socket.emit("consultation:leave", { appointmentId });
}
