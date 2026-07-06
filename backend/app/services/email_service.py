import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from the backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
LOGO_URL = f"{BACKEND_URL}/static/public/images/aicto_logo.jpg"

logger.info(f"[EMAIL] SMTP_SERVER: {SMTP_SERVER}")
logger.info(f"[EMAIL] SMTP_PORT: {SMTP_PORT}")
logger.info(f"[EMAIL] SMTP_EMAIL: {SMTP_EMAIL}")
logger.info(f"[EMAIL] FRONTEND_URL: {FRONTEND_URL}")
logger.info(f"[EMAIL] BACKEND_URL: {BACKEND_URL}")
logger.info(f"[EMAIL] SMTP_PASSWORD configured: {bool(SMTP_PASSWORD and SMTP_PASSWORD != 'ton-app-password-gmail')}")


def send_welcome_email(recipient_email: str, organization_name: str) -> bool:
    """
    Send a professional welcome email right after account creation.
    No action required from the user — account is under admin review.
    """
    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AICTO</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px;text-align:center;">
              <img src="{LOGO_URL}" alt="AICTO" style="height:52px;width:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Arab ICT Organization</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 48px 36px;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">Welcome to AICTO,</h1>
              <h2 style="margin:0 0 28px;font-size:20px;font-weight:600;color:#2563eb;">{organization_name}</h2>

              <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
                Your account has been successfully created on the <strong>Arab Regional AI Initiatives Repository</strong> — the official platform for discovering, sharing, and scaling AI initiatives across the Middle East and North Africa.
              </p>

              <!-- Status pill -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 22px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;">
                          <div style="width:8px;height:8px;background:#f59e0b;border-radius:50%;margin-top:6px;"></div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Account Under Review</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#78350f;line-height:1.5;">
                            Your account is currently being reviewed by our administrative team. You will receive a confirmation email once it has been approved and activated.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
                We typically process new accounts within <strong>1–2 business days</strong>. If you have any questions in the meantime, feel free to reach out to our support team.
              </p>

              <p style="margin:28px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                Best regards,<br>
                <strong style="color:#0f172a;">The AICTO Team</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Arab ICT Organization (AICTO)</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 AICTO · Arab Regional AI Repository · All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">This is an automated message — please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return _send_email(recipient_email, "Welcome to AICTO — Account Created Successfully", html_body)


def send_registration_pending_email(recipient_email: str, organization_name: str) -> bool:
    """Kept for backward compatibility — delegates to send_welcome_email."""
    return send_welcome_email(recipient_email, organization_name)


def send_verification_email(recipient_email: str, organization_name: str, token: str) -> bool:
    """
    Send email verification link with simplified wording.
    """
    if not all([SMTP_EMAIL, SMTP_PASSWORD]) or SMTP_EMAIL == "ton.email@gmail.com":
        logger.warning("[EMAIL] ⚠️ SMTP not configured. Verification link (dev): "
                       f"{FRONTEND_URL}/verify-email?token={token}")
        return False

    # Le lien pointe maintenant directement vers le BACKEND pour validation immédiate
    verify_link = f"{BACKEND_URL}/api/auth/verify?token={token}"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .container {{ max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: #ffffff; color: #1e293b; padding: 30px 20px; text-align: center; border-bottom: 2px solid #2563EB; }}
        .logo-img {{ width: 120px; height: auto; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; color: #374151; line-height: 1.6; text-align: center; }}
        .button-yes {{ display: inline-block; padding: 16px 36px; background: #2563EB; color: white !important; 
                   text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;
                   box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); margin: 10px; }}
        .button-no {{ display: inline-block; padding: 16px 36px; background: #f3f4f6; color: #6b7280 !important; 
                   text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 10px; }}
        .footer {{ padding: 25px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
    </style>
</head>
<body style="margin: 0; padding: 40px 20px; background: #f3f4f6;">
    <div class="container">
        <div class="header">
            <img src="{LOGO_URL}" alt="AICTO Logo" class="logo-img">
            <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #2563EB;">AICTO</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #111827;">Bonjour {organization_name},</h2>
            <p>Est-ce bien vous qui avez créé un compte sur la plateforme AICTO ?</p>
            
            <div style="margin: 30px 0;">
                <a href="{verify_link}" class="button-yes">Oui, c'est moi</a>
                <a href="#" class="button-no">Non, pas moi</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Si vous cliquez sur "Oui", votre compte sera activé instantanément.
            </p>
        </div>
        <div class="footer">
            <p><strong>Arab ICT Organization (AICTO)</strong><br>
            © 2026 AICTO. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""

    return _send_email(recipient_email, "Vérification de votre compte AICTO", html_body)


def send_reset_email(recipient_email: str, organization_name: str, token: str) -> bool:
    """
    Send password reset email.
    """
    if not all([SMTP_EMAIL, SMTP_PASSWORD]) or SMTP_EMAIL == "ton.email@gmail.com":
        logger.warning("[EMAIL] ⚠️ SMTP not configured. Reset link (dev): "
                       f"{FRONTEND_URL}/reset-password?token={token}")
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .container {{ max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: #ffffff; color: #1e293b; padding: 30px 20px; text-align: center; border-bottom: 2px solid #2563EB; }}
        .logo-img {{ width: 100px; height: auto; margin-bottom: 5px; }}
        .content {{ padding: 40px 30px; background: #ffffff; }}
        .button {{ display: inline-block; padding: 14px 32px; background: #2563EB; color: white !important; 
                   text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }}
        .footer {{ padding: 25px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
    </style>
</head>
<body style="margin: 0; padding: 20px; background: #f3f4f6;">
    <div class="container">
        <div class="header">
            <img src="{LOGO_URL}" alt="AICTO Logo" class="logo-img">
            <h1 style="margin: 0; font-size: 20px; color: #2563EB;">AICTO AI Repository</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0;">Hello {organization_name},</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>
            <p><strong>This link expires in 15 minutes.</strong></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2026 AICTO Arab Regional AI Repository<br>
            This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>"""

    return _send_email(recipient_email, "Reset Your Password - AICTO AI Repository", html_body)


def send_approval_email(recipient_email: str, organization_name: str) -> bool:
    """
    Send email when admin approves the account.
    """
    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved — AICTO</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px;text-align:center;">
              <img src="{LOGO_URL}" alt="AICTO" style="height:52px;width:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Arab ICT Organization</p>
            </td>
          </tr>

          <!-- Green success banner -->
          <tr>
            <td style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:20px 48px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <!-- Checkmark circle -->
                    <div style="width:28px;height:28px;background:#16a34a;border-radius:50%;text-align:center;line-height:28px;">
                      <span style="color:#ffffff;font-size:16px;font-weight:700;">&#10003;</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#166534;letter-spacing:0.02em;">Your account has been approved</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 48px 36px;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">Welcome aboard,</h1>
              <h2 style="margin:0 0 28px;font-size:20px;font-weight:600;color:#2563eb;">{organization_name}</h2>

              <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
                We are pleased to inform you that your account on the <strong>AICTO Arab Regional AI Repository</strong> has been reviewed and <strong>officially approved</strong> by our administrative team.
              </p>

              <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.7;">
                You now have full access to the platform. You can explore AI initiatives across the Arab region, connect with stakeholders, and contribute to the growing knowledge base.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);box-shadow:0 4px 16px rgba(37,99,235,0.35);">
                    <a href="{FRONTEND_URL}/login"
                       style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      Access the Platform &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What you can do -->
              <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;width:100%;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">What you can do now</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#374151;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#8594;</span>Browse the AI initiatives repository
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#374151;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#8594;</span>Submit and manage your own AI projects
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#374151;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#8594;</span>Connect with regional stakeholders and partners
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#374151;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#8594;</span>Access analytics and impact reports
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                Best regards,<br>
                <strong style="color:#0f172a;">The AICTO Team</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Arab ICT Organization (AICTO)</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 AICTO · Arab Regional AI Repository · All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">This is an automated message — please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return _send_email(recipient_email, "Your AICTO Account Has Been Approved — Welcome Aboard", html_body)


def send_rejection_email(recipient_email: str, organization_name: str, reason: str = None) -> bool:
    """
    Send email when admin rejects the account.
    """
    reason_text = f"<p><strong>Raison :</strong> {reason}</p>" if reason else ""
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .container {{ max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: #ffffff; color: #1e293b; padding: 30px 20px; text-align: center; border-bottom: 2px solid #ef4444; }}
        .logo-img {{ width: 120px; height: auto; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; color: #374151; line-height: 1.6; }}
        .footer {{ padding: 25px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
    </style>
</head>
<body style="margin: 0; padding: 40px 20px; background: #f3f4f6;">
    <div class="container">
        <div class="header">
            <img src="{LOGO_URL}" alt="AICTO Logo" class="logo-img">
            <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #ef4444;">AICTO</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #111827;">Bonjour {organization_name},</h2>
            <p>Nous regrettons de vous informer que votre demande de compte sur AICTO AI Repository n'a pas pu être approuvée pour le moment.</p>
            {reason_text}
            <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez nous contacter ou essayer de vous réinscrire avec des informations complètes.</p>
        </div>
        <div class="footer">
            <p><strong>Arab ICT Organization (AICTO)</strong><br>
            © 2026 AICTO. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
    return _send_email(recipient_email, "Mise à jour concernant votre compte AICTO", html_body)


def _send_email(recipient_email: str, subject: str, html_content: str) -> bool:
    """Internal helper to send email."""
    logger.info(f"[EMAIL] 📧 Attempting to send '{subject}' to {recipient_email}...")
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("[EMAIL] ❌ SMTP credentials missing in environment variables.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AICTO AI Repository <{SMTP_EMAIL}>"
    msg["To"] = recipient_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        logger.info(f"[EMAIL] 🔌 Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
            server.starttls()
            logger.info(f"[EMAIL] 🔐 Logging in as {SMTP_EMAIL}...")
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            logger.info(f"[EMAIL] ✉️ Sending message...")
            server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())
        logger.info(f"[EMAIL] ✅ Email '{subject}' sent successfully to {recipient_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error(f"[EMAIL] ❌ Authentication failed for {SMTP_EMAIL}. Check App Password.")
        return False
    except Exception as e:
        logger.error(f"[EMAIL] ❌ Failed to send email to {recipient_email}: {str(e)}")
        return False
