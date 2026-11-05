import { DocumentItem } from "@/components/portal/DocumentItem";
import { Uploader } from "@/components/portal/Uploader";
import { Alert, EmptyState, PageHeader } from "@/components/portal/ui";
import { requireUser } from "@/lib/portal/auth";
import type { DocumentCategory, DocumentRow, DocumentVersion } from "@/lib/portal/types";

export const metadata = { title: "My Documents" };

type DocWithRelations = DocumentRow & {
  document_versions: DocumentVersion[];
  application_documents: { applications: { reference: string } | null }[];
};

export default async function DocumentsPage() {
  const { supabase, user } = await requireUser("/portal/documents");
  const [{ data: docs }, { data: categories }] = await Promise.all([
    supabase
      .from("documents")
      .select("*, document_versions(*), application_documents(applications(reference))")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("document_categories").select("*").eq("active", true).order("sort_order"),
  ]);
  const cats = (categories ?? []) as DocumentCategory[];
  const list = (docs ?? []) as unknown as DocWithRelations[];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="My documents"
        intro="Upload each certificate or transcript once and reuse it across applications. Files are stored privately and are only visible to you and authorised GlobalPath staff."
      />
      <Uploader categories={cats} />
      <Alert tone="info">
        Upload your passport or ID only when your GlobalPath adviser asks for it. Do not upload bank statements or account details here.
      </Alert>

      {list.length === 0 ? (
        <EmptyState title="No documents yet">Start with your most recent academic certificate and transcript.</EmptyState>
      ) : (
        <ul className="grid gap-4">
          {list.map((d) => (
            <DocumentItem
              key={d.id}
              doc={d}
              versions={d.document_versions ?? []}
              categoryLabel={cats.find((c) => c.code === d.category)?.label ?? d.category}
              usedIn={(d.application_documents ?? []).map((l) => l.applications?.reference).filter((r): r is string => Boolean(r))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
