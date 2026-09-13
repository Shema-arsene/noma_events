import QRCode from "qrcode";

export const QR_PAYLOAD_VERSION = "NOMA1";

export function buildQrPayload(ticketId: string, rawToken: string): string {
  return `${QR_PAYLOAD_VERSION}.${ticketId}.${rawToken}`;
}

export function parseQrPayload(payload: string): { ticketId: string; rawToken: string } | null {
  const parts = payload.split(".");
  if (parts.length !== 3 || parts[0] !== QR_PAYLOAD_VERSION) return null;
  const [, ticketId, rawToken] = parts;
  if (!ticketId || !rawToken) return null;
  return { ticketId, rawToken };
}

export async function generateQrImage(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 320 });
}
