import crypto from "crypto";

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const generateCredentialId = () => {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `UC-${Date.now()}-${rand}`;
};

export const buildCertificatePayload = (certificate) => {
  const issuedAtValue = certificate?.issuedAt
    ? new Date(certificate.issuedAt).toISOString()
    : "";

  return [
    normalizeValue(certificate?.credentialId),
    normalizeValue(certificate?.title),
    normalizeValue(certificate?.issuer),
    normalizeValue(certificate?.verificationUrl),
    normalizeValue(certificate?.certificateUrl),
    issuedAtValue,
    normalizeValue(certificate?.issuedBy),
    normalizeValue(certificate?.userId),
  ].join("|");
};

export const signCertificatePayload = (payload, secret) => {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

export const verifyCertificateSignature = ({ certificate, signature, secret }) => {
  if (!signature || !secret) return false;
  const payload = buildCertificatePayload(certificate);
  const expected = signCertificatePayload(payload, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(String(signature));

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};
