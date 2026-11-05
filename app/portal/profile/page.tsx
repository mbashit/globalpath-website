import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Card, Field, PageHeader, SelectField } from "@/components/portal/ui";
import { updateProfileAction } from "../actions";
import { getProfile, requireUser } from "@/lib/portal/auth";
import { destinationOptions } from "@/data/forms";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  await requireUser("/portal/profile");
  const p = await getProfile();
  if (!p) return null;
  return (
    <div className="grid gap-6">
      <PageHeader title="My profile" intro="Use your names exactly as they appear on your passport and certificates." />
      <Card title="Personal information">
        <ActionForm action={updateProfileAction} className="grid gap-5 sm:grid-cols-2">
          <Field label="Legal first name(s)" name="first_name" defaultValue={p.first_name} autoComplete="given-name" required maxLength={100} />
          <Field label="Legal last name" name="last_name" defaultValue={p.last_name} autoComplete="family-name" required maxLength={100} />
          <Field label="Date of birth" name="date_of_birth" type="date" defaultValue={p.date_of_birth ?? ""} autoComplete="bday" />
          <Field label="Nationality" name="nationality" defaultValue={p.nationality ?? ""} maxLength={100} placeholder="e.g. Nigerian" />
          <Field label="Country of residence" name="country_of_residence" defaultValue={p.country_of_residence ?? ""} autoComplete="country-name" maxLength={100} />
          <Field label="Phone / WhatsApp" name="phone" type="tel" defaultValue={p.phone ?? ""} autoComplete="tel" placeholder="+234 800 000 0000" hint="Include your country code" />
          <SelectField label="Preferred study destination" name="preferred_destination" defaultValue={p.preferred_destination ?? ""} options={destinationOptions} optional />
          <Field label="Email" name="email_display" value={p.email} disabled hint="Change your email in Account Settings" />
          <div className="sm:col-span-2">
            <SubmitButton>Save profile</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
