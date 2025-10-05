import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded even if this module is imported standalone
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    // Log the full error for better debugging
    console.error(`Error sending email to: ${to}. Subject: "${subject}"`);
    console.error('Nodemailer error: ', error);
    // Add a more descriptive error message for the API response
    error.message = `Failed to send email. Reason: ${error.message}`;
    throw error; // Re-throw to handle in caller
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Rent a Read! 📚';
  const html = `
    <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
        <div style="background:#0ea5e9; color:white; padding:20px 24px;">
          <h1 style="margin:0; font-size:22px;">Welcome, ${name}!</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 12px 0; font-size:16px;">We’re thrilled to have you at <strong>Rent a Read</strong>.</p>
          <p style="margin:0 0 12px 0;">Discover new stories, lend your favorites, and connect with fellow readers.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block; background:#0ea5e9; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:8px;">Start exploring</a>
        </div>
        <div style="padding:16px 24px; color:#475569; border-top:1px solid #e2e8f0; font-size:12px;">
          <p style="margin:0;">Happy reading,<br/>The Rent a Read Team</p>
        </div>
      </div>
    </div>`;
  await sendEmail(email, subject, html);
};

export const sendRentalNotification = async (email, type, rental) => {
  let subject, html;
  if (type === 'request') {
    subject = 'You have a new rental request ✉️';
    html = `
      <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
          <div style="background:#22c55e; color:white; padding:16px 20px;">
            <h2 style="margin:0; font-size:18px;">New Rental Request</h2>
          </div>
          <div style="padding:20px;">
            <p style="margin:0 0 8px 0;">You have a new request for:</p>
            <div style="background:#f1f5f9; padding:12px 14px; border-radius:8px;">
              <div style="font-weight:600;">${rental?.book?.title || 'Unknown Title'}</div>
              <div style="color:#475569;">by ${rental?.book?.author || 'Unknown Author'}</div>
            </div>
            <p style="margin:12px 0 0 0;">Please visit your rentals to accept or reject this request.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#22c55e; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">Review request</a>
          </div>
        </div>
      </div>`;
  } else if (type === 'accepted') {
    subject = 'Good news! Your rental was accepted ✅';
    html = `
      <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
          <div style="background:#0ea5e9; color:white; padding:16px 20px;">
            <h2 style="margin:0; font-size:18px;">Request Accepted</h2>
          </div>
          <div style="padding:20px;">
            <p style="margin:0 0 8px 0;">Your request for <strong>${rental?.book?.title || 'the book'}</strong> has been accepted.</p>
            <p style="margin:0 0 8px 0;">Complete the payment to start your rental.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#0ea5e9; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">Proceed to payment</a>
          </div>
        </div>
      </div>`;
  } else if (type === 'rejected') {
    subject = 'Your rental request was declined';
    html = `
      <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
          <div style="background:#ef4444; color:white; padding:16px 20px;">
            <h2 style="margin:0; font-size:18px;">Request Declined</h2>
          </div>
          <div style="padding:20px;">
            <p style="margin:0 0 8px 0;">Unfortunately, your request for <strong>${rental?.book?.title || 'the book'}</strong> was declined.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#334155; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">Find another book</a>
          </div>
        </div>
      </div>`;
  }
  else if (type === 'withdrawn') {
    subject = 'Rental request withdrawn';
    html = `
      <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
          <div style="background:#94a3b8; color:white; padding:16px 20px;">
            <h2 style="margin:0; font-size:18px;">Request Withdrawn</h2>
          </div>
          <div style="padding:20px;">
            <p style="margin:0 0 8px 0;">The borrower has withdrawn their request for:</p>
            <div style="background:#f1f5f9; padding:12px 14px; border-radius:8px;">
              <div style="font-weight:600;">${rental?.book?.title || 'Your book'}</div>
              <div style="color:#475569;">by ${rental?.book?.author || 'Unknown Author'}</div>
            </div>
            <p style="margin:12px 0 0 0;">The book is now available again.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#94a3b8; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">View rentals</a>
          </div>
        </div>
      </div>`;
  }
  await sendEmail(email, subject, html);
};



export const sendDueDateReminderEmail = async (email, rental) => {
  const subject = 'Reminder: Your book is due soon ⏰';
  const due = rental?.dueDate ? new Date(rental.dueDate) : null;
  const dueStr = due ? due.toLocaleDateString() : 'soon';
  const html = `
    <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
        <div style="background:#f59e0b; color:white; padding:16px 20px;">
          <h2 style="margin:0; font-size:18px;">Return Reminder</h2>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 8px 0;">This is a friendly reminder to return:</p>
          <div style="background:#f1f5f9; padding:12px 14px; border-radius:8px;">
            <div style="font-weight:600;">${rental?.book?.title || 'Your rented book'}</div>
            <div style="color:#475569;">by ${rental?.book?.author || 'Unknown Author'}</div>
          </div>
          <p style="margin:12px 0 0 0;">Due date: <strong>${dueStr}</strong></p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#f59e0b; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">View rental</a>
        </div>
      </div>
    </div>`;
  await sendEmail(email, subject, html);
};

export const sendSuspensionEmail = async (email, name, reason) => {
  const subject = 'Account Suspension Notice';
  const html = `
    <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
        <div style="background:#ef4444; color:white; padding:16px 20px;">
          <h2 style="margin:0; font-size:18px;">Account Suspended</h2>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 8px 0;">Dear ${name},</p>
          <p style="margin:0 0 8px 0;">Your account on Rent a Read has been suspended.</p>
          <p style="margin:0 0 8px 0;"><strong>Reason:</strong> ${reason}</p>
          <p style="margin:0 0 8px 0;">If you believe this is an error or have questions, please contact our support team.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#334155; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">Contact Support</a>
        </div>
        <div style="padding:16px 20px; color:#475569; border-top:1px solid #e2e8f0; font-size:12px;">
          <p style="margin:0;">Regards,<br/>The Rent a Read Team</p>
        </div>
      </div>
    </div>`;
  await sendEmail(email, subject, html);
};

export const sendDeletionEmail = async (email, name, reason) => {
  const subject = 'Account Deletion Notice';
  const html = `
    <div style="font-family:Segoe UI, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(2,6,23,0.06)">
        <div style="background:#dc2626; color:white; padding:16px 20px;">
          <h2 style="margin:0; font-size:18px;">Account Deleted</h2>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 8px 0;">Dear ${name},</p>
          <p style="margin:0 0 8px 0;">Your account on Rent a Read has been permanently deleted.</p>
          <p style="margin:0 0 8px 0;"><strong>Reason:</strong> ${reason}</p>
          <p style="margin:0 0 8px 0;">If you believe this is an error or have questions, please contact our support team.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="display:inline-block; background:#334155; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; margin-top:10px;">Contact Support</a>
        </div>
        <div style="padding:16px 20px; color:#475569; border-top:1px solid #e2e8f0; font-size:12px;">
          <p style="margin:0;">Regards,<br/>The Rent a Read Team</p>
        </div>
      </div>
    </div>`;
  await sendEmail(email, subject, html);
};
