import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, Input, ListRow, MutationError, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
}

const HOMEPAGE_KEY = "marketing_homepage";
const emptySetting = { key: "", value: "{}" };
const emptyEdit = { key: "", value: "{}" };

export function SettingsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptySetting);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const settings = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_settings")
        .select("id, key, value")
        .order("key");
      return supabaseList(data, qErr) as PlatformSetting[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-settings"] });

  const parseValue = (raw: string) => {
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  };

  const createSetting = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("platform_settings").insert({
        key: form.key.trim(),
        value: parseValue(form.value),
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptySetting);
      closeAddForm();
    },
    onError: capture,
  });

  const updateSetting = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("platform_settings")
        .update({
          key: editForm.key.trim(),
          value: parseValue(editForm.value),
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

  const deleteSetting = useMutation({
    mutationFn: async ({ id, key }: { id: string; key: string }) => {
      clear();
      if (key === HOMEPAGE_KEY) {
        throw new Error("Delete the homepage via Homepage editor, or change the key first.");
      }
      if (!confirm(`Delete setting "${key}"?`)) return;
      const { error: mErr } = await getSupabase().from("platform_settings").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = (s: PlatformSetting) => {
    clear();
    setEditingId(s.id);
    setEditForm({
      key: s.key,
      value: JSON.stringify(s.value ?? {}, null, 2),
    });
  };

  const generalSettings = (settings.data ?? []).filter((s) => s.key !== HOMEPAGE_KEY);

  return (
    <>
      <PageTitle>Platform Settings</PageTitle>
      <MutationError message={error} />
      <Card title="Marketing homepage">
        <p className="ed-text-sm ed-muted">
          Homepage content is edited on the dedicated screen.
        </p>
        <Link to="/admin/homepage">
          <Button variant="ghost">Open homepage editor</Button>
        </Link>
      </Card>
      <AddFormSection buttonLabel="Create setting" panelTitle="Create setting">
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <Input label="Key" value={form.key} onChange={(v) => setForm((f) => ({ ...f, key: v }))} placeholder="support_email" />
              <Input label="Value (JSON)" value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} placeholder='{"email":"help@edunudg.com"}' />
              <Button
                onClick={() => {
                  try {
                    parseValue(form.value);
                    createSetting.mutate();
                  } catch {
                    capture(new Error("Value must be valid JSON"));
                  }
                }}
                disabled={!form.key.trim() || createSetting.isPending}
              >
                Create setting
              </Button>
            </>
          );
        }}
      </AddFormSection>
      <Card title="All settings">
        <DataList
          items={generalSettings}
          empty="No settings besides homepage."
          render={(s) => {
            const editing = editingId === s.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => startEdit(s)}
                    onSave={() => {
                      try {
                        parseValue(editForm.value);
                        updateSetting.mutate(s.id);
                      } catch {
                        capture(new Error("Value must be valid JSON"));
                      }
                    }}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteSetting.mutate({ id: s.id, key: s.key })}
                    saveDisabled={!editForm.key.trim()}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Key" value={editForm.key} onChange={(v) => setEditForm((f) => ({ ...f, key: v }))} />
                    <Input label="Value (JSON)" value={editForm.value} onChange={(v) => setEditForm((f) => ({ ...f, value: v }))} />
                  </div>
                ) : (
                  <div>
                    <strong>{s.key}</strong>
                    <pre className="ed-text-sm ed-muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(s.value).slice(0, 120)}
                      {JSON.stringify(s.value).length > 120 ? "…" : ""}
                    </pre>
                  </div>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
