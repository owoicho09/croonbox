function layout(bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
                <span style="font-size:18px;font-weight:700;color:#0f172a;">Croonbox</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#0f172a;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
                Croonbox — structured async video interviews for hiring teams.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">${label}</a>`;
}

export function candidateInvitationEmail(params: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewUrl: string;
  deadlineText?: string;
}) {
  const { candidateName, jobTitle, companyName, interviewUrl, deadlineText } = params;
  return layout(`
    <p>Hi ${candidateName},</p>
    <p><strong>${companyName}</strong> has invited you to a live AI interview for the
    <strong>${jobTitle}</strong> role.</p>
    <p>When you&rsquo;re ready, click below and you&rsquo;ll have a short live voice conversation with
    our AI interviewer — no scheduling required, just find a quiet spot with good signal.</p>
    ${deadlineText ? `<p style="color:#64748b;font-size:13px;">Please complete it by ${deadlineText}.</p>` : ""}
    ${button(interviewUrl, "Start Interview")}
    <p style="margin-top:24px;color:#64748b;font-size:13px;">This link is unique to you — please don&rsquo;t share it.</p>
  `);
}

export function passwordResetEmail(params: { name: string; resetUrl: string }) {
  return layout(`
    <p>Hi ${params.name},</p>
    <p>We received a request to reset your Croonbox password. This link expires in 1 hour.</p>
    ${button(params.resetUrl, "Reset Password")}
    <p style="margin-top:24px;color:#64748b;font-size:13px;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
  `);
}

export function employerReviewReadyEmail(params: {
  name: string;
  candidateName: string;
  jobTitle: string;
  reviewUrl: string;
}) {
  return layout(`
    <p>Hi ${params.name},</p>
    <p><strong>${params.candidateName}</strong>&rsquo;s interview for <strong>${params.jobTitle}</strong>
    has finished processing and is ready for review.</p>
    ${button(params.reviewUrl, "Review Interview")}
  `);
}

export function welcomeEmail(params: { name: string; companyName: string; jobsUrl: string }) {
  return layout(`
    <p>Hi ${params.name.split(" ")[0]},</p>
    <p>Welcome to Croonbox — <strong>${params.companyName}</strong>&rsquo;s workspace is ready.</p>
    <p>Create a job, add the description and context, and Croonbox will prepare a live AI interviewer
    for it automatically. From there you invite candidates, and once they complete their interview
    you&rsquo;ll get the recording, transcript, and an AI-generated report to review.</p>
    ${button(params.jobsUrl, "Create your first job")}
  `);
}

export function teamInvitationEmail(params: {
  inviterName: string;
  companyName: string;
  inviteUrl: string;
}) {
  return layout(`
    <p>${params.inviterName} has invited you to join <strong>${params.companyName}</strong> on Croonbox.</p>
    ${button(params.inviteUrl, "Accept Invitation")}
  `);
}
