import React, { useEffect, useMemo, useState } from "react";
import {
  Save,
  Upload,
  FileText,
  Download,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import {
  updateClubProfile,
  uploadClubConstitution,
  updateClubLogo,
} from "../../services/clubService";

const categories = [
  "Engineering",
  "Academic",
  "Environment",
  "Creative",
  "Business",
  "Cultural",
  "Sports",
  "Arts",
];

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const getCurrentUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("userInfo")) ||
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("authUser")) ||
      null
    );
  } catch {
    return null;
  }
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const sameId = (a, b) => {
  if (!a || !b) return false;
  return String(a?._id || a) === String(b?._id || b);
};

const managerRoles = [
  "president",
  "vice_president",
  "treasurer",
  "secretary",
  "assistant_secretary",
  "assistant_treasurer",
  "event_coordinator",
  "project_coordinator",
  "executive_committee_member",
];

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return imageUrl.startsWith("/")
    ? `${API_BASE_URL}${imageUrl}`
    : `${API_BASE_URL}/${imageUrl}`;
};

const ClubSettingsTab = ({ club, onClubUpdated }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Academic",
    tags: "",
  });

  const [constitutionFile, setConstitutionFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [constitutionLoading, setConstitutionLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [constitutionMessage, setConstitutionMessage] = useState("");
  const [logoMessage, setLogoMessage] = useState("");

  const [errors, setErrors] = useState({});

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id;
  const userRole = normalizeText(currentUser?.role);

  const canManageSettings = useMemo(() => {
    if (!club || !currentUserId) return false;

    if (String(currentUser?.role || "").trim().toUpperCase() === "SYSTEM_ADMIN") {
      return true;
    }

    if (club?.clubAdmin?.user && sameId(club.clubAdmin.user, currentUserId)) {
      return true;
    }

    if (club?.president?.user && sameId(club.president.user, currentUserId)) {
      return true;
    }

    const membership =
      club?.members?.find((member) => {
        const memberUserId =
          member?.user?._id || member?.user || member?._id || member?.memberId;

        return (
          String(memberUserId) === String(currentUserId) &&
          normalizeText(member?.status) === "approved"
        );
      }) || null;

    return managerRoles.includes(normalizeText(membership?.role));
  }, [club, currentUser, currentUserId, userRole]);

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || "",
        description: club.description || "",
        category: club.category || "Academic",
        tags: Array.isArray(club.tags) ? club.tags.join(", ") : "",
      });
    }
  }, [club]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Club name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    return newErrors;
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();

    if (!canManageSettings) {
      setMessage("You are not allowed to edit this club.");
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);
    setMessage("");

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const res = await updateClubProfile(club._id, payload);

      setMessage(res?.message || "Club details updated successfully");

      if (onClubUpdated) {
        onClubUpdated();
      }
    } catch (error) {
      console.error("Error updating club:", error);
      setMessage(
        error?.response?.data?.message || "Failed to update club details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConstitutionUpload = async (e) => {
    e.preventDefault();

    if (!canManageSettings) {
      setConstitutionMessage("You are not allowed to update the constitution.");
      return;
    }

    setConstitutionMessage("");

    if (!constitutionFile) {
      setConstitutionMessage("Please select a PDF file");
      return;
    }

    if (constitutionFile.type !== "application/pdf") {
      setConstitutionMessage("Only PDF files are allowed");
      return;
    }

    try {
      setConstitutionLoading(true);

      const form = new FormData();
      form.append("constitution", constitutionFile);

      const res = await uploadClubConstitution(club._id, form);

      setConstitutionMessage(
        res?.message || "Constitution uploaded successfully"
      );
      setConstitutionFile(null);

      if (onClubUpdated) {
        onClubUpdated();
      }
    } catch (error) {
      console.error("Error uploading constitution:", error);
      setConstitutionMessage(
        error?.response?.data?.message || "Failed to upload constitution"
      );
    } finally {
      setConstitutionLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();

    if (!canManageSettings) {
      setLogoMessage("You are not allowed to update the club logo.");
      return;
    }

    setLogoMessage("");

    if (!logoFile) {
      setLogoMessage("Please select an image file");
      return;
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(logoFile.type)) {
      setLogoMessage("Only JPG, JPEG, PNG, and WEBP image files are allowed");
      return;
    }

    try {
      setLogoLoading(true);

      const form = new FormData();
      form.append("logo", logoFile);

      const res = await updateClubLogo(club._id, form);

      setLogoMessage(res?.message || "Club logo uploaded successfully");
      setLogoFile(null);

      if (onClubUpdated) {
        onClubUpdated();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      setLogoMessage(
        error?.response?.data?.message || "Failed to upload club logo"
      );
    } finally {
      setLogoLoading(false);
    }
  };

  const constitutionDownloadUrl = club?._id
    ? `${API_BASE_URL}/api/clubs/${club._id}/constitution/download`
    : null;

  return (
    <div className="space-y-6">
      {!canManageSettings && (
        <div className="rounded-2xl border border-[#0B1E8A]/10 bg-[#0B1E8A]/5 px-4 py-3 text-sm text-gray-600 flex items-start gap-2">
          <Lock size={16} className="mt-0.5 text-[#F36C21]" />
          <span>
            You can view club settings information, but you are not allowed to
            edit club details, upload a logo, or upload a constitution for this
            club.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#0B1E8A]/10 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-[#0B1E8A] mb-1">
          Club Settings
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update the club details.
        </p>

        {message && (
          <div className="mb-4 rounded-xl bg-[#F36C21]/10 px-4 py-3 text-sm text-[#F36C21] border border-[#F36C21]/20">
            {message}
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Club Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!canManageSettings}
              className={`w-full rounded-xl border px-4 py-2.5 bg-white text-[#0B1E8A] focus:outline-none focus:ring-2 disabled:bg-[#0B1E8A]/5 disabled:text-gray-500 ${
                errors.name
                  ? "border-red-300 focus:ring-red-100"
                  : "border-[#0B1E8A]/15 focus:ring-[#F36C21]/30"
              }`}
              placeholder="Enter club name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!canManageSettings}
              rows={5}
              className={`w-full rounded-xl border px-4 py-2.5 bg-white text-[#0B1E8A] focus:outline-none focus:ring-2 disabled:bg-[#0B1E8A]/5 disabled:text-gray-500 ${
                errors.description
                  ? "border-red-300 focus:ring-red-100"
                  : "border-[#0B1E8A]/15 focus:ring-[#F36C21]/30"
              }`}
              placeholder="Enter club description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={!canManageSettings}
              className={`w-full rounded-xl border px-4 py-2.5 bg-white text-[#0B1E8A] focus:outline-none focus:ring-2 disabled:bg-[#0B1E8A]/5 disabled:text-gray-500 ${
                errors.category
                  ? "border-red-300 focus:ring-red-100"
                  : "border-[#0B1E8A]/15 focus:ring-[#F36C21]/30"
              }`}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              disabled={!canManageSettings}
              className="w-full rounded-xl border border-[#0B1E8A]/15 px-4 py-2.5 bg-white text-[#0B1E8A] focus:outline-none focus:ring-2 focus:ring-[#F36C21]/30 disabled:bg-[#0B1E8A]/5 disabled:text-gray-500"
              placeholder="e.g. innovation, leadership, technology"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !canManageSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B1E8A] px-5 py-2.5 text-white font-semibold hover:bg-[#08156b] disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#0B1E8A]/10 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={18} className="text-[#F36C21]" />
          <h2 className="text-2xl font-bold text-[#0B1E8A]">Club Logo</h2>
        </div>

        {club?.logo && (
          <div className="mb-4">
            <img
              src={getImageSrc(club.logo)}
              alt={`${club?.name || "Club"} logo`}
              className="h-28 w-28 rounded-2xl object-cover border border-[#0B1E8A]/10"
            />
          </div>
        )}

        {logoMessage && (
          <div className="mb-4 rounded-xl bg-[#F36C21]/10 px-4 py-3 text-sm text-[#F36C21] border border-[#F36C21]/20">
            {logoMessage}
          </div>
        )}

        <form onSubmit={handleLogoUpload} className="space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            disabled={!canManageSettings}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#0B1E8A]/5 file:px-4 file:py-2 file:font-semibold file:text-[#0B1E8A] hover:file:bg-[#0B1E8A]/10 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={logoLoading || !canManageSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F36C21] px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
          >
            <Upload size={16} />
            {logoLoading ? "Uploading..." : "Upload Logo"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#0B1E8A]/10 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-[#F36C21]" />
          <h2 className="text-2xl font-bold text-[#0B1E8A]">
            Club Constitution
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Upload a PDF constitution file for this club.
        </p>

        {constitutionMessage && (
          <div className="mb-4 rounded-xl bg-[#F36C21]/10 px-4 py-3 text-sm text-[#F36C21] border border-[#F36C21]/20">
            {constitutionMessage}
          </div>
        )}

        <form onSubmit={handleConstitutionUpload} className="space-y-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setConstitutionFile(e.target.files?.[0] || null)}
            disabled={!canManageSettings}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#0B1E8A]/5 file:px-4 file:py-2 file:font-semibold file:text-[#0B1E8A] hover:file:bg-[#0B1E8A]/10 disabled:opacity-60"
          />

          {club?.constitution?.fileName && constitutionDownloadUrl && (
            <a
              href={constitutionDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E8A]/15 bg-[#0B1E8A]/5 px-4 py-2.5 text-[#0B1E8A] font-semibold hover:bg-[#0B1E8A]/10"
            >
              <Download size={16} />
              Download Current Constitution
            </a>
          )}

          <button
            type="submit"
            disabled={constitutionLoading || !canManageSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F36C21] px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
          >
            <Upload size={16} />
            {constitutionLoading ? "Uploading..." : "Upload Constitution"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClubSettingsTab;