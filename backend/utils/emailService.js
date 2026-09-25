import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"UniConnect Events" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} - MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error to ${to}:`, error.message);
    return false;
  }
};

// Send registration / waitlist / promoted email
export const sendRegistrationEmail = async (
  to,
  studentName,
  eventTitle,
  status
) => {
  let subject = "";
  let htmlContent = "";

  if (status === "registered") {
    subject = `Registration Confirmed - ${eventTitle}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
          <h1 style="margin: 0; font-size: 24px; color: white;">Registration Confirmed!</h1>
        </div>

        <div style="background-color: white; padding: 35px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Dear <strong>${studentName}</strong>,</p>

          <p style="font-size: 16px; color: #555;">
            Great news! You have been <strong>successfully registered</strong> for the following event:
          </p>

          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #4CAF50;">
            <h2 style="color: #2e7d32; margin: 0 0 5px 0; font-size: 20px;">🎉 ${eventTitle}</h2>
            <p style="color: #558b2f; margin: 0; font-size: 14px;">Your spot is confirmed!</p>
          </div>

          <p style="font-size: 16px; color: #555;">We look forward to seeing you at the event!</p>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>📌 Quick Tips:</strong><br>
              • Please arrive on time<br>
              • Bring your student ID<br>
              • Check your email for any updates
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

          <p style="color: #999; font-size: 13px; text-align: center;">
            Best regards,<br>
            <strong style="color: #667eea;">UniConnect Event Management Team</strong>
          </p>
        </div>
      </div>
    `;
  } else if (status === "waitlist") {
    subject = `Added to Waitlist - ${eventTitle}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
        <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 50px; margin-bottom: 10px;">⏳</div>
          <h1 style="margin: 0; font-size: 24px; color: white;">Added to Waitlist</h1>
        </div>

        <div style="background-color: white; padding: 35px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Dear <strong>${studentName}</strong>,</p>

          <p style="font-size: 16px; color: #555;">Thank you for your interest in the following event:</p>

          <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #FF9800;">
            <h2 style="color: #e65100; margin: 0 0 5px 0; font-size: 20px;">📋 ${eventTitle}</h2>
            <p style="color: #ef6c00; margin: 0; font-size: 14px;">Event is currently at full capacity</p>
          </div>

          <p style="font-size: 16px; color: #555;">You have been added to the <strong>waiting list</strong>.</p>

          <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffecb3;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>📢 What happens next?</strong><br>
              • If a registered student cancels, you will be automatically promoted<br>
              • You will receive an email notification immediately when promoted<br>
              • No action needed from your side - just wait!
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

          <p style="color: #999; font-size: 13px; text-align: center;">
            Best regards,<br>
            <strong style="color: #667eea;">UniConnect Event Management Team</strong>
          </p>
        </div>
      </div>
    `;
  } else if (status === "promoted") {
    subject = `Promoted from Waitlist! - ${eventTitle}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
        <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 50px; margin-bottom: 10px;">🎊</div>
          <h1 style="margin: 0; font-size: 24px; color: white;">Great News! You're In!</h1>
        </div>

        <div style="background-color: white; padding: 35px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Dear <strong>${studentName}</strong>,</p>

          <p style="font-size: 16px; color: #555;">
            Wonderful news! A spot has opened up and you have been <strong>promoted from the waitlist</strong>!
          </p>

          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #2196F3;">
            <h2 style="color: #1565c0; margin: 0 0 5px 0; font-size: 20px;">🎉 ${eventTitle}</h2>
            <p style="color: #1976D2; margin: 0; font-size: 14px;">You are now officially registered!</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c8e6c9;">
            <p style="margin: 0; font-size: 14px; color: #2e7d32;">
              <strong>✅ Your Status: REGISTERED</strong><br>
              You have been moved from the waiting list to the registered list. Your spot is now confirmed!
            </p>
          </div>

          <p style="font-size: 16px; color: #555;">We look forward to seeing you at the event! 🎉</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

          <p style="color: #999; font-size: 13px; text-align: center;">
            Best regards,<br>
            <strong style="color: #667eea;">UniConnect Event Management Team</strong>
          </p>
        </div>
      </div>
    `;
  } else {
    console.error(`❌ Invalid registration email status: ${status}`);
    return false;
  }

  return await sendEmail(to, subject, htmlContent);
};

// Send reminder email
export const sendEventReminder = async (
  to,
  studentName,
  eventTitle,
  eventDate,
  venue,
  startTime
) => {
  const subject = `Reminder: ${eventTitle} is Tomorrow!`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
      <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <div style="font-size: 50px; margin-bottom: 10px;">🔔</div>
        <h1 style="margin: 0; font-size: 24px; color: white;">Event Reminder!</h1>
      </div>

      <div style="background-color: white; padding: 35px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333;">Dear <strong>${studentName}</strong>,</p>

        <p style="font-size: 16px; color: #555;">
          This is a friendly reminder that your event is <strong>happening tomorrow</strong>!
        </p>

        <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #9C27B0;">
          <h2 style="color: #7b1fa2; margin: 0 0 15px 0; font-size: 20px;">${eventTitle}</h2>
          <p style="margin: 8px 0; font-size: 15px; color: #4a148c;">
            📅 <strong>Date:</strong> ${new Date(eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p style="margin: 8px 0; font-size: 15px; color: #4a148c;">
            ⏰ <strong>Time:</strong> ${startTime}
          </p>
          <p style="margin: 8px 0; font-size: 15px; color: #4a148c;">
            📍 <strong>Venue:</strong> ${venue}
          </p>
        </div>

        <div style="background-color: #fce4ec; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f8bbd0;">
          <p style="margin: 0; font-size: 14px; color: #c62828;">
            <strong>⚡ Don't forget:</strong><br>
            • Arrive on time<br>
            • Bring your student ID<br>
            • Check the venue location beforehand
          </p>
        </div>

        <p style="font-size: 16px; color: #555;">See you there! 🎉</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

        <p style="color: #999; font-size: 13px; text-align: center;">
          Best regards,<br>
          <strong style="color: #667eea;">UniConnect Event Management Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(to, subject, htmlContent);
};