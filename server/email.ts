type OutboundEmail = { to: string; subject: string; html: string };

/** Sends transactional email when a Resend API key and verified sender are configured. */
export async function sendSchoolEmail({ to, subject, html }: OutboundEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    console.error("[Email] Transactional delivery failed", await response.text());
    return false;
  }
  return true;
}
