import nodemailer from "nodemailer";

const buildTransportConfig = () => {
  const rawUser = process.env.EMAIL_USER || "";
  const rawPass = process.env.EMAIL_PASS || "";
  const user = rawUser.trim();
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in environment");
  }

  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: { user, pass },
    };
  }

  return {
    service: "Gmail",
    auth: { user, pass },
  };
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transportConfig = buildTransportConfig();
  const transporter = nodemailer.createTransport(transportConfig);

  const fromUser = (process.env.EMAIL_USER || "").trim();

  await transporter.sendMail({
    from: `UniConnect <${fromUser}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
};

export default sendEmail;
