import { ActionForm, PasswordInput, SubmitButton } from "@/components/portal/forms";
import { MfaPanel } from "@/components/portal/MfaPanel";
import { Alert, Card, Field, PageHeader } from "@/components/portal/ui";
import { changeEmailAction, changePasswordAction, requestDeletionAction } from "../actions";
import { getProfile, requireUser } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";

export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const { user } = await requireUser("/portal/settings");
  const profile = await getProfile();

  return (
    <div className="grid gap-6">
      <PageHeader title="Account settings" intro={<>Signed in as <strong className="text-ink">{user.email}</strong></>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password">
          <ActionForm action={changePasswordAction} className="grid gap-4" resetOnSuccess>
            <PasswordInput name="currentPassword" label="Current password" autoComplete="current-password" />
            <PasswordInput name="password" label="New password" autoComplete="new-password" showStrength />
            <PasswordInput name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
            <div>
              <SubmitButton pendingText="Updating…">Change password</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Two-step verification" description="Recommended for everyone. Required for GlobalPath staff.">
            <MfaPanel mode="manage" />
          </Card>
          <Card title="Change email address">
            <ActionForm action={changeEmailAction} className="grid gap-4" resetOnSuccess>
              <Field label="New email address" name="email" type="email" autoComplete="email" required />
              <div>
                <SubmitButton variant="secondary" pendingText="Sending…">Send confirmation</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>
      </div>

      <Card title="Delete my account" description="Ask GlobalPath to permanently delete your account, profile, applications and uploaded documents.">
        {profile?.deletion_requested_at ? (
          <Alert tone="warn">You requested deletion on {formatDate(profile.deletion_requested_at)}. GlobalPath will process it and confirm by email.</Alert>
        ) : (
          <ActionForm action={requestDeletionAction} className="grid gap-4 sm:max-w-md">
            <Field label='Type "DELETE" to confirm' name="confirm" autoComplete="off" />
            <div>
              <SubmitButton variant="danger" pendingText="Sending…">Request account deletion</SubmitButton>
            </div>
          </ActionForm>
        )}
        <p className="mt-4 text-sm text-ink-faint">
          Some records may need to be kept for a limited time where the law requires it. See the Privacy Policy for details.
        </p>
      </Card>
    </div>
  );
}
