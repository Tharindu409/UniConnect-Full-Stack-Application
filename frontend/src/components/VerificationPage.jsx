import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, Calendar, Users, FileText } from "lucide-react";
import API from "./Auth/axios";

const GLOBAL_VERIFICATION_CACHE_KEY = "uniconnect-cert-verification:global";
const VERIFICATION_CACHE_KEY_PREFIX = "uniconnect-cert-verification:";

const VerificationPage = () => {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackNavigation = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const verifyCredential = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await API.get(`/credentials/verify/${credentialId}`);
        setData(response.data);

        const verified = Boolean(response?.data?.valid) && response?.data?.status === "VALID";
        const result = {
          verified,
          status: response?.data?.status || "UNKNOWN",
          checkedAt: new Date().toISOString(),
          message: verified
            ? "Certificate is valid and active"
            : "Certificate verification failed",
        };

        try {
          const rawGlobalCache = localStorage.getItem(GLOBAL_VERIFICATION_CACHE_KEY);
          const globalCache = rawGlobalCache ? JSON.parse(rawGlobalCache) : {};
          const normalizedCredentialId = String(credentialId || "").trim();
          globalCache[normalizedCredentialId] = result;
          localStorage.setItem(GLOBAL_VERIFICATION_CACHE_KEY, JSON.stringify(globalCache));

          const rawUser = localStorage.getItem("user");
          const parsedUser = rawUser ? JSON.parse(rawUser) : {};
          const resolvedUserId = String(parsedUser?._id || "").trim();
          if (resolvedUserId) {
            const perUserKey = `${VERIFICATION_CACHE_KEY_PREFIX}${resolvedUserId}`;
            const rawUserCache = localStorage.getItem(perUserKey);
            const userCache = rawUserCache ? JSON.parse(rawUserCache) : {};
            userCache[normalizedCredentialId] = result;
            localStorage.setItem(perUserKey, JSON.stringify(userCache));
          }
        } catch {
          // Ignore storage errors.
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to verify certificate");
      } finally {
        setLoading(false);
      }
    };

    if (!credentialId) {
      setError("Credential ID is required");
      setLoading(false);
      return;
    }

    verifyCredential();
  }, [credentialId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
          </div>
          <p className="text-center text-slate-600 font-semibold">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-rose-100">
              <XCircle size={32} className="text-rose-600" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 text-center mb-2">Verification Failed</h1>
          <p className="text-center text-slate-600 mb-6">{error}</p>
          <button
            onClick={handleBackNavigation}
            className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const isValid = data?.valid && data?.status === "VALID";
  const credential = data?.credential || {};

 return (
  <div className="min-h-screen bg-[#f7faff] py-8 px-4">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleBackNavigation}
          className="p-2 rounded-lg border border-[#d7e2f6] text-[#516072] hover:bg-[#eef4ff] transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black text-[#1b2230]">
          Certificate Verification
        </h1>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-[#d7e2f6] shadow-lg overflow-hidden">
        {/* Status Header */}
        <div
          className={`px-8 py-6 border-b border-[#dbe6f8] ${
            isValid
              ? "bg-gradient-to-r from-[#eef4ff] to-[#f8fbff]"
              : "bg-gradient-to-r from-[#fff1f2] to-[#fff7f7]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-full ${
                isValid ? "bg-[#eaf1ff]" : "bg-[#ffe5e7]"
              }`}
            >
              {isValid ? (
                <CheckCircle2 size={40} className="text-[#2f5ea8]" />
              ) : (
                <AlertCircle size={40} className="text-[#d14b61]" />
              )}
            </div>
            <div>
              <h2
                className={`text-2xl font-black ${
                  isValid ? "text-[#2f5ea8]" : "text-[#b42318]"
                }`}
              >
                {isValid ? "Certificate Verified ✓" : "Certificate Invalid"}
              </h2>
              <p className="text-sm text-[#516072] mt-1">
                {isValid
                  ? "This credential is authentic and currently active."
                  : "This credential could not be verified."}
              </p>
            </div>
          </div>
        </div>

        {/* Credential Details */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8] mb-2">
                Certificate Title
              </p>
              <p className="text-2xl font-black text-[#1b2230]">
                {credential.title || "-"}
              </p>
            </div>

            {/* Credential ID */}
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8] mb-2">
                Credential ID
              </p>
              <div className="flex items-center gap-2 bg-[#f8fbff] rounded-lg p-3 border border-[#d8e3f7]">
                <code className="text-sm font-mono text-[#1b2230] flex-1 break-all">
                  {credential.credentialId || "-"}
                </code>
              </div>
            </div>

            {/* Issuer */}
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8] mb-2">
                Issuer
              </p>
              <p className="text-lg font-bold text-[#1b2230]">
                {credential.issuer || "UniConnect"}
              </p>
            </div>

            {/* Holder Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-[#2f5ea8]" />
                <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8]">
                  Holder Name
                </p>
              </div>
              <p className="text-lg font-bold text-[#1b2230]">
                {credential.holderName || "-"}
              </p>
            </div>

            {/* Student ID */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-[#2f5ea8]" />
                <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8]">
                  Student ID
                </p>
              </div>
              <p className="text-lg font-bold text-[#1b2230]">
                {credential.holderStudentId || "-"}
              </p>
            </div>

            {/* Issue Date */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-[#2f5ea8]" />
                <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8]">
                  Issued Date
                </p>
              </div>
              <p className="text-lg font-bold text-[#1b2230]">
                {credential.issuedAt
                  ? new Date(credential.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider font-bold text-[#2f5ea8] mb-2">
                Verification Status
              </p>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
                  isValid
                    ? "bg-[#eaf1ff] text-[#2f5ea8] border border-[#d7e2f6]"
                    : "bg-[#fff1f2] text-[#b42318] border border-[#f3c7cd]"
                }`}
              >
                {isValid ? (
                  <>
                    <CheckCircle2 size={16} />
                    Valid & Active
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Invalid
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[#dbe6f8] bg-[#f8fbff]">
          <p className="text-xs text-[#516072] text-center">
            This certificate has been cryptographically verified and is immutable.
            To report fraudulent credentials, contact UniConnect support.
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default VerificationPage;
