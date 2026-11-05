import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Card, EmptyState, PageHeader, TextAreaField, buttonClass } from "@/components/portal/ui";
import { markAllReadAction, sendMessageAction } from "../actions";
import { requireUser } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";
import { cn } from "@/lib/cn";
import type { Notification } from "@/lib/portal/types";

export const metadata = { title: "Messages & Notifications" };

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser("/portal/notifications");
  const [{ data: notes }, { data: msgs }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("student_id", user.id).order("created_at", { ascending: true }).limit(200),
  ]);
  const notifications = (notes ?? []) as Notification[];
  const unread = notifications.filter((n) => !n.read_at).length;
  const messages = (msgs ?? []) as { id: string; sender_id: string | null; body: string; created_at: string }[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Messages & notifications" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Notifications"
          description={unread ? `${unread} unread` : "All caught up"}
          actions={
            unread > 0 && (
              <form action={markAllReadAction}>
                <button type="submit" className={`${buttonClass.link} text-sm`}>Mark all as read</button>
              </form>
            )
          }
        >
          {notifications.length === 0 ? (
            <EmptyState title="No notifications yet" />
          ) : (
            <ul className="divide-y divide-line">
              {notifications.map((n) => (
                <li key={n.id} className={cn("py-3", !n.read_at && "relative pl-4")}>
                  {!n.read_at && <span className="absolute left-0 top-5 h-2 w-2 rounded-full bg-brandorange" aria-label="Unread" />}
                  <p className="font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-sm text-ink-muted">{n.body}</p>}
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-ink-faint">
                    {formatDate(n.created_at, true)}
                    {n.link && n.link.startsWith("/portal") && (
                      <Link href={n.link} className="font-semibold text-navy hover:underline">Open</Link>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Messages with GlobalPath" description="For questions about your documents or applications. For urgent matters, use WhatsApp.">
          <div className="grid max-h-[480px] gap-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-ink-muted">No messages yet.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", mine ? "ml-auto bg-navy text-white" : "bg-canvas text-ink ring-1 ring-line")}>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className={cn("mt-1 text-xs", mine ? "text-white/70" : "text-ink-faint")}>
                      {mine ? "You" : "GlobalPath"} · {formatDate(m.created_at, true)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <ActionForm action={sendMessageAction} className="mt-4 grid gap-3" resetOnSuccess>
            <TextAreaField label="New message" name="body" rows={3} maxLength={4000} hint="Please do not share passwords or bank details." />
            <div>
              <SubmitButton pendingText="Sending…">Send message</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
