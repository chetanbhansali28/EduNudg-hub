import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, Input, ListRow, MutationError, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const emptyLog = { action: "", resource_type: "", resource_id: "", payload: "{}" };
const emptyEdit = { action: "", resource_type: "", resource_id: "", payload: "{}" };

export function AuditLogsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyLog);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);

  const logs = useQuery({
    queryKey: ["platform-audit"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return supabaseList(data, qErr) as AuditLog[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-audit"] });

  const parsePayload = (raw: string) => {
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  };

  const createLog = useMutation({
    mutationFn: async () => {
      clear();
      const { data: session } = await getSupabase().auth.getSession();
      const { error: mErr } = await getSupabase().from("platform_audit_logs").insert({
        action: form.action.trim(),
        resource_type: form.resource_type.trim(),
        resource_id: form.resource_id.trim() || null,
        payload: parsePayload(form.payload),
        actor_id: session.session?.user.id ?? null,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyLog);
    },
    onError: capture,
  });

  const updateLog = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("platform_audit_logs")
        .update({
          action: editForm.action.trim(),
          resource_type: editForm.resource_type.trim(),
          resource_id: editForm.resource_id.trim() || null,
          payload: parsePayload(editForm.payload),
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      clear();
      if (!confirm("Delete this audit entry? Use only for mistaken test data.")) return;
      const { error: mErr } = await getSupabase().from("platform_audit_logs").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = (l: AuditLog) => {
    clear();
    setEditingId(l.id);
    setEditForm({
      action: l.action,
      resource_type: l.resource_type,
      resource_id: l.resource_id ?? "",
      payload: JSON.stringify(l.payload ?? {}, null, 2),
    });
  };

  return (
    <>
      <PageTitle>Audit Logs</PageTitle>
      <MutationError message={error} />
      <Card title="Record audit event">
        <Input label="Action" value={form.action} onChange={(v) => setForm((f) => ({ ...f, action: v }))} placeholder="brand.created" />
        <Input
          label="Resource type"
          value={form.resource_type}
          onChange={(v) => setForm((f) => ({ ...f, resource_type: v }))}
          placeholder="brands"
        />
        <Input
          label="Resource ID (optional)"
          value={form.resource_id}
          onChange={(v) => setForm((f) => ({ ...f, resource_id: v }))}
          placeholder="uuid"
        />
        <Input
          label="Payload (JSON)"
          value={form.payload}
          onChange={(v) => setForm((f) => ({ ...f, payload: v }))}
          placeholder="{}"
        />
        <Button
          onClick={() => {
            try {
              parsePayload(form.payload);
              createLog.mutate();
            } catch {
              capture(new Error("Payload must be valid JSON"));
            }
          }}
          disabled={!form.action.trim() || !form.resource_type.trim() || createLog.isPending}
        >
          Log event
        </Button>
      </Card>
      <Card title="Recent events">
        <DataList
          items={logs.data ?? []}
          empty="No audit events."
          render={(l) => {
            const editing = editingId === l.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => startEdit(l)}
                    onSave={() => {
                      try {
                        parsePayload(editForm.payload);
                        updateLog.mutate(l.id);
                      } catch {
                        capture(new Error("Payload must be valid JSON"));
                      }
                    }}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteLog.mutate(l.id)}
                    saveDisabled={!editForm.action.trim() || !editForm.resource_type.trim()}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Action" value={editForm.action} onChange={(v) => setEditForm((f) => ({ ...f, action: v }))} />
                    <Input
                      label="Resource type"
                      value={editForm.resource_type}
                      onChange={(v) => setEditForm((f) => ({ ...f, resource_type: v }))}
                    />
                    <Input
                      label="Resource ID"
                      value={editForm.resource_id}
                      onChange={(v) => setEditForm((f) => ({ ...f, resource_id: v }))}
                    />
                    <Input
                      label="Payload (JSON)"
                      value={editForm.payload}
                      onChange={(v) => setEditForm((f) => ({ ...f, payload: v }))}
                    />
                  </div>
                ) : (
                  <span>
                    {l.action} on {l.resource_type}
                    {l.resource_id ? ` (${l.resource_id.slice(0, 8)}…)` : ""} — {new Date(l.created_at).toLocaleString()}
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
