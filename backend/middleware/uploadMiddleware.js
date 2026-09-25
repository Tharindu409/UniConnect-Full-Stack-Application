import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const documentExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const imageFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = imageMimeTypes.includes(file.mimetype);
  const isValidExt = imageExtensions.includes(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP image files are allowed"));
  }
};

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdf = file.mimetype === "application/pdf" && ext === ".pdf";

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const documentFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = documentMimeTypes.includes(file.mimetype);
  const isValidExt = documentExtensions.includes(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed"));
  }
};

// Event image uploader
export const uploadEventImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Certificate / badge image uploader
export const uploadCertificateImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Expense receipt uploader (PDF or image)
export const uploadReceipt = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Club constitution uploader
export const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});