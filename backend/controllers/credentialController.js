import StudentProfile from "../models/StudentProfile.js";
import { verifyCertificateSignature } from "../utils/certificateCredential.js";

const CREDENTIAL_SIGNING_SECRET =
  process.env.CREDENTIAL_SIGNING_SECRET || process.env.JWT_SECRET;

const getFrontendBaseUrl = (req) => {
  const configuredUrl = (process.env.FRONTEND_PUBLIC_URL || process.env.APP_PUBLIC_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const backendBaseUrl = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  return backendBaseUrl.replace(/:5000\/?$/, ":5173").replace(/\/$/, "");
};

export const verifyCertificatePublic = async (req, res) => {
  try {
    if (!CREDENTIAL_SIGNING_SECRET) {
      return res.status(500).json({
        valid: false,
        status: "SERVER_MISCONFIGURED",
        message: "Credential verification secret is missing",
      });
    }

    const { credentialId } = req.params;
    const normalizedCredentialId = String(credentialId || "").trim();

    if (!normalizedCredentialId) {
      return res.status(400).json({ message: "credentialId is required" });
    }

    const isBrowserNavigation =
      req.get("sec-fetch-dest") === "document" ||
      req.get("sec-fetch-mode") === "navigate";

    if (isBrowserNavigation) {
      return res.redirect(`${getFrontendBaseUrl(req)}/verify/${normalizedCredentialId}`);
    }

    const profile = await StudentProfile.findOne({
      "certificates.credentialId": normalizedCredentialId,
    }).populate("user", "fullName email studentId");

    if (!profile) {
      return res.status(404).json({
        valid: false,
        status: "NOT_FOUND",
        message: "Credential not found",
      });
    }

    const certificate = profile.certificates.find(
      (item) => item.credentialId === normalizedCredentialId
    );

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        status: "NOT_FOUND",
        message: "Credential not found",
      });
    }

    const signatureValid = verifyCertificateSignature({
      certificate: {
        credentialId: certificate.credentialId,
        title: certificate.title,
        issuer: certificate.issuer,
        verificationUrl: certificate.verificationUrl,
        certificateUrl: certificate.certificateUrl,
        issuedAt: certificate.issuedAt,
        issuedBy: certificate.issuedBy,
        userId: profile.user?._id,
      },
      signature: certificate.signature,
      secret: CREDENTIAL_SIGNING_SECRET,
    });

    if (signatureValid) {
      certificate.verifiedAt = certificate.verifiedAt || new Date();
      await profile.save();
    }

    return res.status(200).json({
      valid: Boolean(signatureValid),
      status: signatureValid ? "VALID" : "INVALID_SIGNATURE",
      credential: {
        credentialId: certificate.credentialId,
        title: certificate.title,
        issuer: certificate.issuer,
        issuedAt: certificate.issuedAt,
        verifiedAt: certificate.verifiedAt,
        holderName: profile.user?.fullName || "",
        holderStudentId: profile.user?.studentId || "",
        verificationUrl: certificate.verificationUrl,
        certificateUrl: certificate.certificateUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
