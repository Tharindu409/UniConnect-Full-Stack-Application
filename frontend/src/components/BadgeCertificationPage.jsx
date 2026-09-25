import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API from "./Auth/axios";
import {
  BadgeCheck,
  FileBadge2,
  FileDown,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const VERIFICATION_CACHE_KEY_PREFIX = "uniconnect-cert-verification:";
const GLOBAL_VERIFICATION_CACHE_KEY = "uniconnect-cert-verification:global";

const buildKnownCredentialSet = (certificates) =>
  new Set(
    (Array.isArray(certificates) ? certificates : [])
      .map((item) => String(item?.credentialId || "").trim())
      .filter(Boolean)
  );

const loadMergedVerificationCache = ({ resolvedUserId, knownIds }) => {
  const rawGlobalCache = localStorage.getItem(GLOBAL_VERIFICATION_CACHE_KEY);
  const globalCache = rawGlobalCache ? JSON.parse(rawGlobalCache) : {};

  let userCache = {};
  if (resolvedUserId) {
    const cacheKey = `${VERIFICATION_CACHE_KEY_PREFIX}${resolvedUserId}`;
    const rawUserCache = localStorage.getItem(cacheKey);
    userCache = rawUserCache ? JSON.parse(rawUserCache) : {};
  }

  const mergedCache = { ...globalCache, ...userCache };
  return Object.entries(mergedCache).reduce((acc, [key, value]) => {
    if (knownIds.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const BadgeMedallionIcon = () => {
  const shieldClipPath = {
    clipPath:
      "polygon(50% 0%, 94% 16%, 86% 76%, 50% 100%, 14% 76%, 6% 16%)",
  };

  return (
    <div className="relative h-11 w-11 flex-shrink-0">
      <div
        className="absolute inset-0 translate-x-1 translate-y-1 bg-gradient-to-b from-[#1e3a8a] to-[#0ea5e9] opacity-90"
        style={shieldClipPath}
      />
      <div
        className="absolute inset-0 border border-[#67e8f9] bg-gradient-to-b from-[#22d3ee] via-[#38bdf8] to-[#1d4ed8] shadow-[0_6px_18px_rgba(14,116,144,0.35)]"
        style={shieldClipPath}
      />
      <div
        className="absolute inset-[6px] border border-white/70 bg-white/90"
        style={shieldClipPath}
      />
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#4f46e5] px-1.5 py-[1px] text-[8px] font-black tracking-[0.08em] text-white shadow">
        BADGE
      </div>
    </div>
  );
};

const BadgeCertificationPage = () => {
  const [badges, setBadges] = useState([]);
  const [userId, setUserId] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedCertificateImageUrl, setSelectedCertificateImageUrl] = useState("");
  const [certificateImageLoadFailed, setCertificateImageLoadFailed] = useState(false);
  const [thumbnailUnavailableByCertificate, setThumbnailUnavailableByCertificate] = useState({});
  const [deletingCertificateId, setDeletingCertificateId] = useState("");
  const [downloadingCertificateId, setDownloadingCertificateId] = useState("");
  const [verificationByCredential, setVerificationByCredential] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShowcase = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await API.get("/student/dashboard");
        const profile = data?.profile || {};
        const resolvedUserId = String(data?.user?._id || "").trim();
        const resolvedCertificates = Array.isArray(profile.certificates)
          ? profile.certificates
          : [];
        const knownIds = buildKnownCredentialSet(resolvedCertificates);

        setUserId(resolvedUserId);

        try {
          const sanitized = loadMergedVerificationCache({
            resolvedUserId,
            knownIds,
          });
          setVerificationByCredential(sanitized);
        } catch {
          setVerificationByCredential({});
        }

        setBadges(Array.isArray(profile.badges) ? profile.badges : []);
        setCertificates(resolvedCertificates);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load badges and certificates");
      } finally {
        setLoading(false);
      }
    };

    loadShowcase();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const cacheKey = `${VERIFICATION_CACHE_KEY_PREFIX}${userId}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(verificationByCredential));
    } catch {
      // Ignore storage quota errors.
    }
  }, [userId, verificationByCredential]);

  useEffect(() => {
    if (!userId) return;

    const knownIds = buildKnownCredentialSet(certificates);
    if (knownIds.size === 0) return;

    const syncFromStorage = () => {
      try {
        const sanitized = loadMergedVerificationCache({
          resolvedUserId: userId,
          knownIds,
        });
        setVerificationByCredential((prev) => {
          const prevString = JSON.stringify(prev);
          const nextString = JSON.stringify(sanitized);
          return prevString === nextString ? prev : sanitized;
        });
      } catch {
        // Ignore storage parse issues.
      }
    };

    const handleStorage = (event) => {
      if (
        !event.key ||
        event.key === GLOBAL_VERIFICATION_CACHE_KEY ||
        event.key === `${VERIFICATION_CACHE_KEY_PREFIX}${userId}`
      ) {
        syncFromStorage();
      }
    };

    const handleFocus = () => syncFromStorage();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, certificates]);

  const totalItems = useMemo(() => badges.length + certificates.length, [badges, certificates]);

  const resolveCertificateUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;

    const apiBase = API?.defaults?.baseURL || "";
    const host = apiBase.replace(/\/api\/?$/, "");
    if (!host) return url;

    return `${host}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getCertificateImageUrl = (certificate) =>
    resolveCertificateUrl(String(certificate?.certificateUrl || "").trim());

  const openCertificatePreview = (certificate) => {
    setSelectedCertificate(certificate);
    setCertificateImageLoadFailed(false);
    setSelectedCertificateImageUrl(getCertificateImageUrl(certificate));
  };

  const closeCertificatePreview = () => {
    setSelectedCertificate(null);
    setSelectedCertificateImageUrl("");
    setCertificateImageLoadFailed(false);
  };

  const handlePreviewImageError = () => {
    if (
      selectedCertificateImageUrl &&
      selectedCertificateImageUrl.includes("/uploads/certificates/")
    ) {
      const fallbackUrl = selectedCertificateImageUrl.replace(
        "/uploads/certificates/",
        "/uploads/"
      );

      if (fallbackUrl !== selectedCertificateImageUrl) {
        setSelectedCertificateImageUrl(fallbackUrl);
        return;
      }
    }

    setCertificateImageLoadFailed(true);
  };

  const handleCardThumbnailError = (certificateId, event) => {
    const target = event.currentTarget;
    const currentSrc = String(target?.src || "");

    if (
      currentSrc.includes("/uploads/certificates/") &&
      target.dataset.fallbackTried !== "true"
    ) {
      target.dataset.fallbackTried = "true";
      target.src = currentSrc.replace("/uploads/certificates/", "/uploads/");
      return;
    }

    setThumbnailUnavailableByCertificate((prev) => ({
      ...prev,
      [certificateId]: true,
    }));
  };

  const imageBlobToPdfDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        const maxWidth = 1400;
        const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));

        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to prepare certificate image"));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to load certificate image"));
      };

      image.src = objectUrl;
    });

  const getPdfReadyCertificateImage = async (certificate) => {
    const primaryUrl = getCertificateImageUrl(certificate);
    if (!primaryUrl) return "";

    const candidateUrls = [primaryUrl];
    if (primaryUrl.includes("/uploads/certificates/")) {
      candidateUrls.push(primaryUrl.replace("/uploads/certificates/", "/uploads/"));
    }

    for (const candidateUrl of candidateUrls) {
      try {
        const response = await fetch(candidateUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        if (!String(blob.type || "").startsWith("image/")) continue;

        const dataUrl = await imageBlobToPdfDataUrl(blob);
        if (dataUrl) return dataUrl;
      } catch {
        // Try next candidate URL.
      }
    }

    return "";
  };

  const getVerificationMeta = (certificate) => {
    const credentialId = certificate?.credentialId;
    const result = credentialId ? verificationByCredential[credentialId] : null;
    const isVerifiedInDb = Boolean(certificate?.verifiedAt);

    if (result?.verified === true || isVerifiedInDb) {
      return {
        label: "Verified",
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      };
    }

    if (result?.verified === false) {
      return {
        label: "Not Verified",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
      };
    }

    return {
      label: "Unverified",
      className: "bg-slate-100 text-slate-600 border border-slate-200",
    };
  };

  const certificateStatusSummary = useMemo(() => {
    return certificates.reduce(
      (acc, certificate) => {
        const credentialId = certificate?.credentialId;
        const result = credentialId ? verificationByCredential[credentialId] : null;

        if (result?.verified === true || certificate?.verifiedAt) {
          acc.verified += 1;
        } else if (result?.verified === false) {
          acc.notVerified += 1;
        } else {
          acc.unverified += 1;
        }

        return acc;
      },
      { verified: 0, notVerified: 0, unverified: 0 }
    );
  }, [certificates, verificationByCredential]);

  const selectedCertificateMeta = useMemo(() => {
    if (!selectedCertificate) return null;

    const credentialId = String(selectedCertificate?.credentialId || "").trim();
    const verificationResult = credentialId ? verificationByCredential[credentialId] : null;

    return {
      verificationMeta: getVerificationMeta(selectedCertificate),
      verificationMessage: String(verificationResult?.message || "").trim(),
      issuedAtLabel: selectedCertificate?.issuedAt
        ? new Date(selectedCertificate.issuedAt).toLocaleDateString()
        : "N/A",
      verifiedAtLabel: selectedCertificate?.verifiedAt
        ? new Date(selectedCertificate.verifiedAt).toLocaleDateString()
        : "Not yet verified",
    };
  }, [selectedCertificate, verificationByCredential]);

  const handleDownloadCertificatePdf = async (certificate) => {
    const certificateId = String(certificate?._id || "").trim();
    if (!certificateId) return;

    try {
      setDownloadingCertificateId(certificateId);

      const [{ jsPDF }] = await Promise.all([import("jspdf")]);
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 44;
      let y = 54;

      doc.setFillColor(249, 115, 22);
      doc.roundedRect(margin, y - 28, pageWidth - margin * 2, 84, 12, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("UniConnect Certificate Record", margin + 16, y + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Generated from your dashboard", margin + 16, y + 23);

      y += 82;
      doc.setTextColor(15, 23, 42);

      const addDetailRow = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${label}:`, margin, y);

        doc.setFont("helvetica", "normal");
        const text = String(value || "N/A");
        const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2 - 110);
        doc.text(wrapped, margin + 110, y);

        y += Math.max(18, wrapped.length * 14 + 4);
      };

      const verificationMeta = getVerificationMeta(certificate);
      addDetailRow("Title", certificate?.title || "N/A");
      addDetailRow("Issuer", certificate?.issuer || "UniConnect");
      addDetailRow("Credential ID", certificate?.credentialId || "N/A");
      addDetailRow("Status", verificationMeta.label);
      addDetailRow(
        "Issued On",
        certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : "N/A"
      );
      addDetailRow(
        "Verified On",
        certificate?.verifiedAt ? new Date(certificate.verifiedAt).toLocaleDateString() : "Not yet verified"
      );
      addDetailRow("Verification URL", certificate?.verificationUrl || "N/A");

      const imageDataUrl = await getPdfReadyCertificateImage(certificate);
      if (imageDataUrl) {
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Certificate Preview", margin, y);
        y += 10;

        const imageMaxWidth = pageWidth - margin * 2;
        const imageMaxHeight = pageHeight - y - 40;
        const imageProps = doc.getImageProperties(imageDataUrl);
        const widthRatio = imageMaxWidth / imageProps.width;
        const heightRatio = imageMaxHeight / imageProps.height;
        const imageRatio = Math.min(widthRatio, heightRatio, 1);

        const renderWidth = imageProps.width * imageRatio;
        const renderHeight = imageProps.height * imageRatio;
        doc.addImage(imageDataUrl, "JPEG", margin, y + 8, renderWidth, renderHeight);
      }

      const safeFileNamePart =
        String(certificate?.title || "certificate")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "certificate";

      doc.save(`${safeFileNamePart}-details.pdf`);
    } catch (pdfError) {
      toast.error(pdfError?.message || "Failed to download certificate PDF");
    } finally {
      setDownloadingCertificateId("");
    }
  };

  const handleDeleteCertificate = async (certificate) => {
    const certificateDocId = String(certificate?._id || "").trim();
    if (!certificateDocId) {
      return;
    }

    const ok = window.confirm("Delete this certificate from your profile?");
    if (!ok) return;

    try {
      setDeletingCertificateId(certificateDocId);
      await API.delete(`/student/certificates/${encodeURIComponent(certificateDocId)}`);

      setCertificates((prev) => prev.filter((item) => String(item?._id) !== certificateDocId));

      const credentialId = String(certificate?.credentialId || "").trim();
      if (credentialId) {
        setVerificationByCredential((prev) => {
          const updated = { ...prev };
          delete updated[credentialId];
          return updated;
        });

        try {
          const rawGlobalCache = localStorage.getItem(GLOBAL_VERIFICATION_CACHE_KEY);
          const globalCache = rawGlobalCache ? JSON.parse(rawGlobalCache) : {};
          delete globalCache[credentialId];
          localStorage.setItem(GLOBAL_VERIFICATION_CACHE_KEY, JSON.stringify(globalCache));
        } catch {
          // Ignore storage errors.
        }
      }

      closeCertificatePreview();
    } catch (deleteError) {
      toast.error(deleteError?.response?.data?.message || "Failed to delete certificate");
    } finally {
      setDeletingCertificateId("");
    }
  };

  return (
    <div className="space-y-8 bg-[#ffffff] min-h-screen p-4">
      <div className="relative overflow-hidden rounded-3xl border border-[#0a1e8c]/20 bg-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#e6edff] blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#fff4ec] blur-2xl" />

        <div className="relative p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f37021]/40 bg-[#fff4ec] px-3 py-1">
            <Sparkles size={13} className="text-[#f37021]" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f37021]">
              Showcase
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-black text-[#0a1e8c]">
            My Badges & Certificates
          </h1>

          <p className="mt-2 text-sm text-[#4a5b86] max-w-2xl">
            Certificates are presented like traditionally framed wall diplomas to keep a clean, professional showcase.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#0a1e8c]/20 p-4 bg-[#f5f8ff]">
              <p className="text-xs text-[#4a5b86]">Total Items</p>
              <p className="text-2xl font-black text-[#0a1e8c] mt-1">{totalItems}</p>
            </div>

            <div className="rounded-2xl border border-[#0a1e8c]/20 p-4 bg-[#f5f8ff]">
              <p className="text-xs text-[#4a5b86]">Badges</p>
              <p className="text-2xl font-black text-[#0a1e8c] mt-1">{badges.length}</p>
            </div>

            <div className="rounded-2xl border border-[#f37021]/30 p-4 bg-[#fff4ec]">
              <p className="text-xs text-[#f37021]">Verified Certificates</p>
              <p className="text-2xl font-black text-[#f37021] mt-1">
                {certificateStatusSummary.verified}
              </p>
            </div>

            <div className="rounded-2xl border border-[#0a1e8c]/20 p-4 bg-[#f5f8ff]">
              <p className="text-xs text-[#4a5b86]">Need Verification</p>
              <p className="text-2xl font-black text-[#0a1e8c] mt-1">
                {certificateStatusSummary.unverified}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-[#0a1e8c]/20 bg-white p-10 text-center text-[#4a5b86]">
          Loading badges and certificates...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="bg-white rounded-3xl border border-[#0a1e8c]/20 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf0ff] text-[#0a1e8c]">
                  <BadgeCheck size={16} />
                </div>
                <h2 className="text-xl font-black text-[#0a1e8c]">Badges</h2>
              </div>

              <span className="rounded-full border border-[#0a1e8c]/20 bg-[#f5f8ff] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#4a5b86]">
                {badges.length} earned
              </span>
            </div>

            {badges.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#0a1e8c]/20 bg-[#f8faff] p-8 text-center">
                <p className="text-sm font-semibold text-[#4a5b86]">
                  No badges assigned yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {badges.map((badge) => (
                  <div
                    key={badge._id}
                    className="group relative overflow-hidden rounded-2xl border border-[#0a1e8c]/15 bg-gradient-to-br from-[#f9fbff] via-white to-[#f2f7ff] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#dbe7ff] opacity-70 blur-2xl" />
                    <div className="relative flex items-start gap-3">
                      <BadgeMedallionIcon />

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4a5b86]">
                          Achievement Badge
                        </p>
                        <h3 className="mt-1 truncate text-sm font-black text-[#0a1e8c] sm:text-base">
                          {badge.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-[#4a5b86]">
                          {badge.description || "No description"}
                        </p>
                        {badge.criteria && (
                          <p className="mt-2 inline-flex rounded-full border border-[#f37021]/30 bg-[#fff4ec] px-2.5 py-0.5 text-[11px] font-bold text-[#f37021]">
                            Criteria included
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-[#0a1e8c]/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileBadge2 size={18} className="text-[#0a1e8c]" />
              <h2 className="text-xl font-black text-[#0a1e8c]">Certificates</h2>
            </div>

            {certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#0a1e8c]/20 p-8 text-center">
                <p className="text-sm font-semibold text-[#4a5b86]">
                  No certificates assigned yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {certificates.map((certificate) => {
                  const verificationMeta = getVerificationMeta(certificate);
                  const certificateImageUrl = getCertificateImageUrl(certificate);
                  const certificateId = String(certificate?._id || "");
                  const hideThumbnail = Boolean(thumbnailUnavailableByCertificate[certificateId]);

                  return (
                    <div
                      key={certificate._id}
                      className="rounded-xl border border-[#0a1e8c]/20 p-3 bg-[#f5f8ff] cursor-pointer hover:shadow-md transition"
                      onClick={() => openCertificatePreview(certificate)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-[#0a1e8c]/20 bg-white">
                            {certificateImageUrl && !hideThumbnail ? (
                              <img
                                src={certificateImageUrl}
                                alt={`${certificate.title || "Certificate"} thumbnail`}
                                className="h-full w-full object-cover"
                                onError={(event) => handleCardThumbnailError(certificateId, event)}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#4a5b86]">
                                <FileText size={18} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-[#0a1e8c] leading-5">
                              {certificate.title}
                            </h3>
                            <p className="text-xs text-[#4a5b86] mt-0.5">
                              Issued by: {certificate.issuer || "UniConnect"}
                            </p>
                            <p
                              className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${verificationMeta.className}`}
                            >
                              {verificationMeta.label}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Delete certificate"
                          title="Delete certificate"
                          disabled={deletingCertificateId === certificateId}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteCertificate(certificate);
                          }}
                        >
                          {deletingCertificateId === certificateId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-black/50 px-4 py-8" onClick={closeCertificatePreview}>
          <div
            className="mx-auto w-full max-w-4xl rounded-3xl border border-[#0a1e8c]/20 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#0a1e8c]/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  {selectedCertificate.title || "Certificate"}
                </h3>
                <p className="text-sm text-[#4a5b86]">
                  Issued by: {selectedCertificate.issuer || "UniConnect"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCertificatePreview}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#0a1e8c]/20 text-[#0a1e8c] hover:bg-[#f5f8ff]"
                aria-label="Close certificate preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto p-5">
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                {selectedCertificateImageUrl && !certificateImageLoadFailed ? (
                  <img
                    src={selectedCertificateImageUrl}
                    alt={`${selectedCertificate.title || "Certificate"} preview`}
                    className="h-auto max-h-[52vh] w-full rounded-2xl border border-[#0a1e8c]/15 bg-[#f8faff] object-contain"
                    onError={handlePreviewImageError}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#0a1e8c]/20 bg-[#f5f8ff] p-10 text-center">
                    <p className="text-sm font-semibold text-[#4a5b86]">
                      Certificate image is not available for preview.
                    </p>
                  </div>
                )}

                {selectedCertificateMeta && (
                  <div className="rounded-2xl border border-[#0a1e8c]/15 bg-[#f8faff] p-4">
                    <h4 className="text-sm font-black uppercase tracking-wide text-[#0a1e8c]">
                      Certification Details
                    </h4>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#0a1e8c]/10 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a5b86]">
                          Credential ID
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#0a1e8c] break-all">
                          {selectedCertificate.credentialId || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#0a1e8c]/10 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a5b86]">
                          Status
                        </p>
                        <p className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${selectedCertificateMeta.verificationMeta.className}`}>
                          {selectedCertificateMeta.verificationMeta.label}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#0a1e8c]/10 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a5b86]">
                          Issued On
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#0a1e8c]">
                          {selectedCertificateMeta.issuedAtLabel}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#0a1e8c]/10 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a5b86]">
                          Verified On
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#0a1e8c]">
                          {selectedCertificateMeta.verifiedAtLabel}
                        </p>
                      </div>
                    </div>

                    {selectedCertificateMeta.verificationMessage && (
                      <p className="mt-3 text-sm text-[#4a5b86]">
                        {selectedCertificateMeta.verificationMessage}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownloadCertificatePdf(selectedCertificate);
                        }}
                        disabled={downloadingCertificateId === String(selectedCertificate?._id || "")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a1e8c]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#0a1e8c] hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingCertificateId === String(selectedCertificate?._id || "") ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileDown size={14} />
                        )}
                        Download PDF
                      </button>

                      {selectedCertificate.verificationUrl && (
                        <a
                          href={selectedCertificate.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm font-bold text-[#0a1e8c] underline underline-offset-2 hover:text-[#f37021]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open verification link
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeCertificationPage;
