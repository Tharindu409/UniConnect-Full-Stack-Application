import StudentProfile from "../models/StudentProfile.js";
import Skill from "../models/Skill.js";
import Badge from "../models/Badge.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeSkillName = (value) => value.trim().toLowerCase();
const ALLOWED_PROFICIENCY = ["Beginner", "Intermediate", "Advanced", "Expert"];
const ALLOWED_CATEGORY = ["TECHNICAL", "SOFT_SKILL", "MANAGEMENT", "DESIGN"];

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("skills")
      .populate("skillDetails.skill")
      .populate("badges");

    res.status(200).json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


 // UPDATE PROFILE
 export const updateProfile = async (req, res) => {
  try {
    const { degreeProgram, faculty, yearOfStudy, bio } = req.body;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(faculty !== undefined ? { faculty } : {}),
        ...(yearOfStudy !== undefined ? { yearOfStudy: String(yearOfStudy) } : {}),
      },
      { new: true }
    );

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { degreeProgram, faculty, yearOfStudy, bio },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("skills")
      .populate("skillDetails.skill")
      .populate("badges");

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 // ADD SKILL
 export const addSkill = async (req, res) => {
  try {
    const { skillId, skillName, proficiency, relatedActivity, category } = req.body;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let resolvedSkillId = skillId;

    if (!resolvedSkillId && skillName) {
      const cleanedName = skillName.trim();
      const normalizedSkillName = normalizeSkillName(cleanedName);

      if (!cleanedName) {
        return res.status(400).json({ message: "Skill name cannot be empty" });
      }

      const existingSkill = await Skill.findOne({
        $or: [
          { normalizedName: normalizedSkillName },
          { name: { $regex: `^${escapeRegex(cleanedName)}$`, $options: "i" } },
        ],
      });

      if (existingSkill) {
        resolvedSkillId = existingSkill._id;
      } else {
        const createdSkill = await Skill.create({
          name: cleanedName,
          category: ALLOWED_CATEGORY.includes(category) ? category : "TECHNICAL",
        });
        resolvedSkillId = createdSkill._id;
      }
    }

    if (!resolvedSkillId) {
      return res
        .status(400)
        .json({ message: "Provide either skillId or skillName" });
    }

    const hasSkill = profile.skills.some(
      (id) => id && String(id) === String(resolvedSkillId)
    );

    if (!hasSkill) {
      profile.skills.push(resolvedSkillId);
    }

    if (!Array.isArray(profile.skillDetails)) {
      profile.skillDetails = [];
    }

    const resolvedProficiency = ALLOWED_PROFICIENCY.includes(proficiency)
      ? proficiency
      : "Intermediate";
    const resolvedRelatedActivity =
      typeof relatedActivity === "string" ? relatedActivity.trim() : "";

    const existingDetailIndex = profile.skillDetails.findIndex(
      (detail) => detail?.skill && String(detail.skill) === String(resolvedSkillId)
    );

    if (existingDetailIndex >= 0) {
      profile.skillDetails[existingDetailIndex].proficiency = resolvedProficiency;
      profile.skillDetails[existingDetailIndex].relatedActivity =
        resolvedRelatedActivity;
    } else {
      profile.skillDetails.push({
        skill: resolvedSkillId,
        proficiency: resolvedProficiency,
        relatedActivity: resolvedRelatedActivity,
      });
    }

    await profile.save();

    await profile.populate("skills");
    await profile.populate("skillDetails.skill");
    await profile.populate("badges");

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 // REMOVE SKILL
 export const removeSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    if (
      !skillId ||
      skillId === "undefined" ||
      skillId === "null" ||
      !mongoose.Types.ObjectId.isValid(skillId)
    ) {
      return res.status(400).json({ message: "Valid skillId is required" });
    }

    const skillObjectId = new mongoose.Types.ObjectId(skillId);

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: {
          skills: { $in: [null, skillObjectId] },
          skillDetails: { skill: skillObjectId },
        },
      },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const stillExists = profile.skills.some(
      (id) => id && String(id) === String(skillObjectId)
    );

    if (stillExists) {
      return res.status(500).json({ message: "Skill removal failed" });
    }

    const referencesLeft = await StudentProfile.countDocuments({
      $or: [{ skills: skillObjectId }, { "skillDetails.skill": skillObjectId }],
    });

    if (referencesLeft === 0) {
      await Skill.findByIdAndDelete(skillObjectId);
    }

    await profile.populate("skills");
    await profile.populate("skillDetails.skill");
    await profile.populate("badges");

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 // DELETE CERTIFICATE
 export const deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const normalizedCertificateId = String(certificateId || "").trim();

    if (!normalizedCertificateId) {
      return res.status(400).json({ message: "certificateId is required" });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const certificateIndex = profile.certificates.findIndex(
      (item) => String(item?._id) === normalizedCertificateId
    );

    if (certificateIndex < 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const [removedCertificate] = profile.certificates.splice(certificateIndex, 1);
    await profile.save();

    return res.status(200).json({
      message: "Certificate deleted successfully",
      deletedCertificateId: normalizedCertificateId,
      deletedCredentialId: removedCertificate?.credentialId || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 // GET BADGES
 export const getBadges = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate("badges");
    res.status(200).json(profile.badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
