const AUTH_ENCODING_FLAG = "base64json-v1";

function base64EncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function authEncodingFlag(): string {
  return AUTH_ENCODING_FLAG;
}

export function encodeAuthField(value: string): string {
  return base64EncodeUtf8(value);
}
