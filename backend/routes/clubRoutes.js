import express from "express";
import multer from "multer";
import { uploadPDF, uploadEventImage } from "../middleware/uploadMiddleware.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createClub,
  getAllClubs,
  getActiveClubs,
  getPendingClubs,
  getClubById,
  getClubDashboard,
  updateClub,
  uploadConstitution,
  downloadConstitution,
  approveClub,
  rejectClub,
  deleteClub,
  requestJoinClub,
  getJoinRequests,
  getAllJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  checkJoinStatus,
  cancelJoinRequest,
  getMyClubs,
} from "../controllers/clubController.js";

const router = express.Router();

// combined uploader for logo + constitution
const upload = multer({
  storage: uploadEventImage.storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed"));
    }
  },
});

// ================= PUBLIC =================
router.get("/", getAllClubs);
router.get("/active", getActiveClubs);
router.get("/:id/constitution/download", downloadConstitution);

// ================= PROTECTED =================
router.get("/my-clubs", protect, getMyClubs);

// ================= SYSTEM ADMIN ONLY =================
router.get(
  "/pending",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  getPendingClubs
);

router.post(
  "/",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "constitution", maxCount: 1 },
  ]),
  createClub
);

router.post(
  "/:id/constitution",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  uploadPDF.single("constitution"),
  uploadConstitution
);

router.put(
  "/:id/approve",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  approveClub
);

router.put(
  "/:id/reject",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  rejectClub
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  deleteClub
);

// ================= CLUB ACCESS =================
router.get("/:clubId/dashboard", protect, getClubDashboard);

router.put(
  "/:id",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  updateClub
);

router.put(
  "/:id/logo",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  uploadEventImage.single("logo"),
  updateClub
);

// ================= JOIN REQUESTS =================
router.post("/:id/join", protect, requestJoinClub);
router.delete("/:id/join-request", protect, cancelJoinRequest);
router.get("/:id/join-status", protect, checkJoinStatus);

router.get(
  "/:id/join-requests",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  getJoinRequests
);

router.get(
  "/:id/join-requests/all",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  getAllJoinRequests
);

router.put(
  "/:clubId/join-requests/:requestId/approve",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  approveJoinRequest
);

router.put(
  "/:clubId/join-requests/:requestId/reject",
  protect,
  authorizeRoles("SYSTEM_ADMIN", "CLUB_ADMIN"),
  rejectJoinRequest
);

// ================= LAST =================
router.get("/:id", getClubById);

export default router;