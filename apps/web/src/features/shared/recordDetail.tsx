export function RecordDetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="ed-inquiry-detail__field">
      <dt className="ed-text-sm ed-muted">{label}</dt>
      <dd className="ed-text-sm">{value}</dd>
    </div>
  );
}

export function formatRecordWhen(iso: string) {
  return new Date(iso).toLocaleString();
}
