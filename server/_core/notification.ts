import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a notification to the project owner via email using Resend.
 * Returns `true` if the email was sent, `false` when the service
 * cannot be reached.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.resendApiKey) {
    console.warn("[Notification] RESEND_API_KEY is not configured, skipping notification");
    return false;
  }

  if (!ENV.adminEmail) {
    console.warn("[Notification] ADMIN_EMAIL is not configured, skipping notification");
    return false;
  }

  try {
    const resend = new Resend(ENV.resendApiKey);

    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: ENV.adminEmail,
      subject: `[All Ways Transfers] ${title}`,
      text: content,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; padding: 20px; text-align: center;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png" alt="All Ways Transfers" style="height: 50px;" />
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; color: #555; line-height: 1.6;">${content}</pre>
          </div>
          <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
            This is an automated notification from All Ways Transfers.
          </div>
        </div>
      `,
    });

    if (error) {
      console.warn("[Notification] Failed to send email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error sending notification email:", error);
    return false;
  }
}
