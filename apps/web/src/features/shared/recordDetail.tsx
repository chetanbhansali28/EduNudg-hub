import { PhoneLink } from "@edunudg/ui";

export function RecordDetailField({
  label,
  value,
  linkKind,
}: {
  label: string;
  value: string | null | undefined;
  linkKind?: "phone";
}) {
  if (!value?.trim()) return null;
  return (
    <div className="ed-inquiry-detail__field">
      <dt className="ed-text-sm ed-muted">{label}</dt>
      <dd className="ed-text-sm">
        {linkKind === "phone" ? <PhoneLink phone={value} /> : value}
      </dd>
    </div>
  );
}

export function formatRecordWhen(iso: string) {
  return new Date(iso).toLocaleString();
}
