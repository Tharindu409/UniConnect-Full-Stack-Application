import express from "express";
import { verifyCertificatePublic } from "../controllers/credentialController.js";

const router = express.Router();

router.get("/verify/:credentialId", verifyCertificatePublic);

export default router;
