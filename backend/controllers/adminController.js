import bcrypt from "bcryptjs";
import User, { USER_ROLES } from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Badge from "../models/Badge.js";
import sendEmail from "../utils/sendEmail.js";
import {
  buildCertificatePayload,
  generateCredentialId,
  signCertificatePayload,
} from "../utils/certificateCredential.js";

const CREDENTIAL_SIGNING_SECRET =
  process.env.CREDENTIAL_SIGNING_SECRET || process.env.JWT_SECRET;

const generateUniqueCredentialId = async (maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateCredentialId();
    const duplicateCredential = await StudentProfile.findOne({
      "certificates.credentialId": candidate,
    }).select("_id");

    if (!duplicateCredential) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique credential ID");
};

const getFrontendBaseUrl = (req) => {
  const configuredUrl = (
    process.env.FRONTEND_PUBLIC_URL ||
    process.env.APP_PUBLIC_URL ||
    ""
  ).trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const backendBaseUrl =
    process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;

  return backendBaseUrl.replace(/:5000\/?$/, ":5173").replace(/\/$/, "");
};

const getBackendBaseUrl = (req) => {
  const configuredUrl = (process.env.BACKEND_PUBLIC_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildRewardEmailHtml = ({ fullName, awardItems, dashboardUrl }) => {
  const safeName = escapeHtml(fullName || "Student");

  const msoCards = awardItems
    .map((item) => {
      if (item.type === "badge") {
        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border:1px solid #bfd8ff;background:#f4f8ff;">
            <tr>
              <td style="padding:12px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                <div style="font-size:11px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;letter-spacing:.08em;">Badge Awarded</div>
                <div style="font-size:18px;font-weight:bold;margin-top:4px;">${escapeHtml(
                  item.title
                )}</div>
                ${
                  item.description
                    ? `<div style="margin-top:6px;font-size:13px;"><strong>Description:</strong> ${escapeHtml(
                        item.description
                      )}</div>`
                    : ""
                }
                ${
                  item.criteria
                    ? `<div style="margin-top:6px;font-size:13px;"><strong>Criteria:</strong> ${escapeHtml(
                        item.criteria
                      )}</div>`
                    : ""
                }
              </td>
            </tr>
          </table>`;
      }

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border:1px solid #d5dff0;background:#ffffff;">
          <tr>
            <td style="padding:12px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
              <div style="font-size:11px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;letter-spacing:.08em;">Certificate Issued</div>
              <div style="font-size:18px;font-weight:bold;margin-top:4px;">${escapeHtml(
                item.title
              )}</div>
              ${
                item.issuer
                  ? `<div style="margin-top:6px;font-size:13px;"><strong>Issuer:</strong> ${escapeHtml(
                      item.issuer
                    )}</div>`
                  : ""
              }
              ${
                item.credentialId
                  ? `<div style="margin-top:6px;font-size:13px;"><strong>Credential ID:</strong> ${escapeHtml(
                      item.credentialId
                    )}</div>`
                  : ""
              }
              ${
                item.verificationPageUrl
                  ? `<div style="margin-top:6px;font-size:13px;"><strong>Verification:</strong> <a href="${escapeHtml(
                      item.verificationPageUrl
                    )}" style="color:#1d4ed8;text-decoration:none;">Open verification page</a></div>`
                  : ""
              }
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const cards = awardItems
    .map((item) => {
      if (item.type === "badge") {
        return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #bfd8ff;border-radius:16px;background:#f4f8ff;border-collapse:separate;overflow:hidden;">
      <tr>
        <td style="padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" style="width:46px;">
                <div style="width:40px;height:40px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-align:center;line-height:40px;font-size:19px;">🏅</div>
              </td>
              <td valign="top">
                <div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1d4ed8;">Badge Awarded</div>
                <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:4px;">${escapeHtml(
            item.title
          )}</div>
                ${
                  item.description
                    ? `<div style="color:#334155;font-size:14px;line-height:1.6;margin-top:8px;"><strong style="color:#0f172a;">Description:</strong> ${escapeHtml(
              item.description
            )}</div>`
                    : ""
                }
                ${
                  item.criteria
                    ? `<div style="color:#334155;font-size:14px;line-height:1.6;margin-top:8px;"><strong style="color:#0f172a;">Criteria:</strong> ${escapeHtml(
              item.criteria
            )}</div>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
      }

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #d5dff0;border-radius:16px;background:#ffffff;border-collapse:separate;overflow:hidden;">
          <tr>
            <td style="padding:0;">
              <div style="height:5px;background:linear-gradient(90deg,#1e3a8a 0%,#3b82f6 45%,#ef4444 100%);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;background:linear-gradient(145deg,rgba(59,130,246,.08) 0%,rgba(255,255,255,1) 42%,rgba(239,246,255,.7) 100%);">
              <div style="font-size:28px;line-height:1;font-weight:800;letter-spacing:.22em;color:rgba(29,78,216,.11);text-align:right;margin:0 0 8px;">CERTIFIED</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="width:56px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:#dc2626;color:#ffffff;text-align:center;line-height:44px;font-size:20px;">🎓</div>
                  </td>
                  <td valign="top" style="padding-right:${item.certificateImageUrl ? "14px" : "0"};">
                    <div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1d4ed8;">Certificate Issued</div>
                    <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:4px;">${escapeHtml(
                      item.title
                    )}</div>

                    <div style="margin-top:10px;color:#334155;font-size:14px;line-height:1.65;">
                      ${
                        item.issuer
                          ? `<div><strong style="color:#0f172a;">Issuer:</strong> ${escapeHtml(
                              item.issuer
                            )}</div>`
                          : ""
                      }
                      ${
                        item.credentialId
                          ? `<div><strong style="color:#0f172a;">Credential ID:</strong> ${escapeHtml(
                              item.credentialId
                            )}</div>`
                          : ""
                      }
                      ${
                        item.issuedAt
                          ? `<div><strong style="color:#0f172a;">Issued Date:</strong> ${escapeHtml(
                              item.issuedAt
                            )}</div>`
                          : ""
                      }
                      ${
                        item.verificationPageUrl
                          ? `<div><strong style="color:#0f172a;">Verification:</strong> <a href="${escapeHtml(
                              item.verificationPageUrl
                            )}" style="color:#1d4ed8;text-decoration:none;">Open verification page</a></div>`
                          : ""
                      }
                    </div>
                  </td>
                  ${
                    item.certificateImageUrl
                      ? `<td valign="top" style="width:150px;">
                           <a href="${escapeHtml(
                             item.certificateImageUrl
                           )}" style="text-decoration:none;" target="_blank" rel="noreferrer">
                             <img src="${escapeHtml(
                               item.certificateImageUrl
                             )}" alt="Certificate preview" width="140" style="display:block;width:140px;max-width:140px;height:auto;border:1px solid #d5dff0;border-radius:10px;" />
                           </a>
                         </td>`
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  return `
    <div style="margin:0;padding:22px;background:#e6ebf3;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #d5dff0;border-radius:20px;overflow:hidden;box-shadow:0 14px 38px rgba(15,23,42,.12);font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="padding:24px 26px;background:linear-gradient(120deg,#0f2e69 0%,#1d4ed8 58%,#1e3a8a 100%);color:#fff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top">
                <div style="font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;opacity:.95;">UniConnect Achievement Update</div>
                <h1 style="margin:10px 0 0;font-size:42px;line-height:1.08;letter-spacing:.2px;">Congratulations, ${safeName}!</h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;max-width:620px;color:rgba(255,255,255,.95);">Your achievements are now officially recorded in UniConnect. We have attached your latest update summary below.</p>
              </td>
              <td valign="top" style="width:170px;padding-left:12px;">
                <div style="margin-top:2px;border:1px solid rgba(255,255,255,.45);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.12);text-align:right;">
                  <div style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.9);font-weight:700;">Official Notice</div>
                  <div style="font-size:18px;font-weight:800;color:#ffffff;margin-top:4px;">UniConnect</div>
                  <div style="font-size:11px;line-height:1.45;color:rgba(255,255,255,.92);margin-top:3px;">Credential & Achievement Desk</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:24px 26px;">
          <div style="margin:0 0 14px;padding:12px 14px;border:1px solid #d5dff0;border-radius:12px;background:#f8fbff;color:#334155;font-size:13px;line-height:1.55;">
            This notification confirms your latest badge/certificate assignment. Use the verification link to validate credentials anytime.
          </div>

          <!--[if mso]>
          ${msoCards}
          <![endif]-->

          <!--[if !mso]><!-- -->
          ${cards}
          <!--<![endif]-->

          <div style="margin-top:18px;padding:18px 20px;border-radius:14px;background:#0f172a;color:#e2e8f0;">
            <div style="font-size:15px;font-weight:800;color:#ffffff;margin-bottom:6px;">Next step</div>
            <div style="font-size:14px;line-height:1.65;">Log in to your UniConnect dashboard to view badge details, certificate records, and verification status.</div>
            <a href="${escapeHtml(
              dashboardUrl
            )}" style="display:inline-block;margin-top:14px;padding:11px 16px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:800;font-size:13px;">Open Dashboard</a>
          </div>
        </div>

        <div style="padding:16px 26px 22px;color:#64748b;font-size:12px;line-height:1.6;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <strong style="color:#0f172a;">UniConnect</strong> keeps your achievements organized, verified, and easy to access.
        </div>
      </div>
    </div>`;
};

const toYearNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeAllowedRole = (role) => {
  const value = String(role || "").trim().toUpperCase();
  return USER_ROLES.includes(value) ? value : null;
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    const userIds = users.map((user) => user._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } })
      .populate("badges")
      .select(
        "user faculty yearOfStudy degreeProgram bio badges certificates joinedClubs"
      );

    const profileByUserId = new Map(
      profiles.map((profile) => [String(profile.user), profile])
    );

    const merged = users.map((user) => {
      const profile = profileByUserId.get(String(user._id));
      return {
        ...user.toObject(),
        profile: profile || null,
      };
    });

    res.status(200).json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      studentId,
      faculty,
      yearOfStudy,
      role,
      isActive,
      isEmailVerified,
      degreeProgram,
      bio,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !studentId ||
      !faculty ||
      !yearOfStudy
    ) {
      return res.status(400).json({
        message:
          "fullName, email, password, studentId, faculty, yearOfStudy are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const resolvedRole = role ? normalizeAllowedRole(role) : "STUDENT";

    if (role && !resolvedRole) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      studentId: String(studentId).trim(),
      faculty: String(faculty).trim(),
      yearOfStudy: String(yearOfStudy).trim(),
      role: resolvedRole || "STUDENT",
      isActive: typeof isActive === "boolean" ? isActive : true,
      isEmailVerified:
        typeof isEmailVerified === "boolean" ? isEmailVerified : false,
    });

    const profile = await StudentProfile.create({
      user: user._id,
      faculty: String(faculty).trim(),
      yearOfStudy: toYearNumber(yearOfStudy),
      degreeProgram: degreeProgram || "",
      bio: bio || "",
    });

    const safeUser = await User.findById(user._id).select("-password");

    res.status(201).json({ user: safeUser, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      fullName,
      email,
      password,
      studentId,
      faculty,
      yearOfStudy,
      role,
      isActive,
      isEmailVerified,
      degreeProgram,
      bio,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email.toLowerCase() !== user.email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      const emailInUse = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (emailInUse) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user.email = normalizedEmail;
    }

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (studentId !== undefined) user.studentId = String(studentId).trim();
    if (faculty !== undefined) user.faculty = String(faculty).trim();
    if (yearOfStudy !== undefined) user.yearOfStudy = String(yearOfStudy).trim();

    if (role !== undefined) {
      const resolvedRole = normalizeAllowedRole(role);

      if (!resolvedRole) {
        return res.status(400).json({ message: "Invalid role" });
      }

      user.role = resolvedRole;
    }

    if (typeof isActive === "boolean") user.isActive = isActive;
    if (typeof isEmailVerified === "boolean") {
      user.isEmailVerified = isEmailVerified;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      {
        ...(faculty !== undefined ? { faculty: String(faculty).trim() } : {}),
        ...(yearOfStudy !== undefined
          ? { yearOfStudy: toYearNumber(yearOfStudy) }
          : {}),
        ...(degreeProgram !== undefined ? { degreeProgram } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("badges")
      .populate("skillDetails.skill");

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({ user: safeUser, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    await StudentProfile.findOneAndDelete({ user: userId });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find({}).sort({ createdAt: -1 });
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBadge = async (req, res) => {
  try {
    const { title, description, icon, criteria } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Badge title is required" });
    }

    const normalizedTitle = title.trim();
    const existingBadge = await Badge.findOne({
      title: {
        $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingBadge) {
      return res
        .status(400)
        .json({ message: "Badge with this title already exists" });
    }

    const badge = await Badge.create({
      title: normalizedTitle,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
      criteria: criteria?.trim() || "",
    });

    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeId, certificateTitle, issuer, verificationUrl } = req.body;

    if (!CREDENTIAL_SIGNING_SECRET) {
      return res.status(500).json({
        message:
          "Credential signing secret is missing in environment configuration",
      });
    }

    const user = await User.findById(userId).select("fullName email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const awardItems = [];

    if (badgeId) {
      const badge = await Badge.findById(badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      const alreadyHasBadge = profile.badges.some(
        (id) => String(id) === String(badgeId)
      );

      if (!alreadyHasBadge) {
        profile.badges.push(badgeId);
        awardItems.push({
          type: "badge",
          title: badge.title,
          description: badge.description || "",
          criteria: badge.criteria || "",
        });
      }
    }

    if (certificateTitle && certificateTitle.trim()) {
      const resolvedCredentialId = await generateUniqueCredentialId();
      const frontendBaseUrl = getFrontendBaseUrl(req);
      const backendBaseUrl = getBackendBaseUrl(req);
      const verificationPageUrl = `${frontendBaseUrl}/verify/${resolvedCredentialId}`;

      const certificateData = {
        title: certificateTitle.trim(),
        issuer: issuer?.trim() || "UniConnect",
        credentialId: resolvedCredentialId,
        verificationUrl: verificationUrl?.trim() || verificationPageUrl,
        certificateUrl: "",
        issuedAt: new Date(),
        issuedBy: req.user?._id,
        status: "ACTIVE",
        signature: "",
      };

      if (req.file) {
        certificateData.certificateUrl = `/uploads/certificates/${req.file.filename}`;
      }

      const signaturePayload = buildCertificatePayload({
        ...certificateData,
        userId,
      });

      certificateData.signature = signCertificatePayload(
        signaturePayload,
        CREDENTIAL_SIGNING_SECRET
      );

      profile.certificates.push(certificateData);

      awardItems.push({
        type: "certificate",
        title: certificateData.title,
        issuer: certificateData.issuer,
        credentialId: certificateData.credentialId,
        issuedAt: new Date(certificateData.issuedAt).toLocaleDateString(),
        certificateImageUrl: certificateData.certificateUrl
          ? `${backendBaseUrl}${certificateData.certificateUrl.startsWith("/") ? "" : "/"}${certificateData.certificateUrl}`
          : "",
        verificationPageUrl,
      });
    }

    await profile.save();
    await profile.populate("badges");

    if (awardItems.length > 0) {
      try {
        const dashboardUrl = `${
          process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`
        }/dashboard`;

        const textLines = [
          `Hello ${user.fullName || "Student"},`,
          "",
          "Congratulations! You have received new achievement updates in your UniConnect account.",
          "",
          ...awardItems.map((item) => {
            if (item.type === "badge") {
              return [
                `Badge: ${item.title}`,
                item.description ? `Description: ${item.description}` : null,
                item.criteria ? `Criteria: ${item.criteria}` : null,
              ]
                .filter(Boolean)
                .join("\n");
            }

            return [
              `Certificate: ${item.title}`,
              item.issuer ? `Issuer: ${item.issuer}` : null,
              item.credentialId ? `Credential ID: ${item.credentialId}` : null,
              item.verificationPageUrl
                ? `Verification: ${item.verificationPageUrl}`
                : null,
            ]
              .filter(Boolean)
              .join("\n");
          }),
          "",
          "Open your dashboard to view the complete details.",
          "",
          "Regards,",
          "UniConnect Team",
        ].join("\n");

        await sendEmail({
          to: user.email,
          subject: "UniConnect: Your new achievement is ready",
          text: textLines,
          html: buildRewardEmailHtml({
            fullName: user.fullName,
            awardItems,
            dashboardUrl,
          }),
        });
      } catch (emailError) {
        console.error("Reward email notification failed:", {
          message: emailError?.message,
          code: emailError?.code,
          response: emailError?.response,
        });
      }
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};