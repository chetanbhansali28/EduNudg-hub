import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { computeInvoiceStatusAfterPayment, type InvoiceStatus } from "@/lib/centerFeesHelpers";

export type { InvoiceStatus };

export type CenterInvoiceRow = {
  id: string;
  invoice_number: string | null;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  due_at: string | null;
  created_at: string;
  student_id: string;
  student_name: string;
  student_code: string | null;
};

export type CenterPaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  method: string | null;
  paid_at: string;
  invoice_id: string | null;
  invoice_number: string | null;
  student_name: string | null;
};

export type CreateCenterInvoiceInput = {
  brandId: string;
  centerId: string;
  studentId: string;
  amountCents: number;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  dueAt?: string | null;
};

export type RecordCenterPaymentInput = {
  brandId: string;
  centerId: string;
  invoiceId: string;
  amountCents: number;
  method?: string;
  paidAt?: string;
};

function studentFromJoin(
  row: { full_name?: string; student_code?: string | null } | { full_name?: string; student_code?: string | null }[] | null
): { name: string; code: string | null } {
  const student = Array.isArray(row) ? row[0] : row;
  return {
    name: student?.full_name ?? "Student",
    code: student?.student_code ?? null,
  };
}

export async function fetchCenterInvoices(centerId: string): Promise<CenterInvoiceRow[]> {
  const { data, error } = await getSupabase()
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_at, created_at, student_id, students(full_name, student_code)"
    )
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  const rows = supabaseList(data, error) as unknown as {
    id: string;
    invoice_number: string | null;
    amount_cents: number;
    currency: string;
    status: InvoiceStatus;
    due_at: string | null;
    created_at: string;
    student_id: string;
    students: { full_name: string; student_code: string | null } | { full_name: string; student_code: string | null }[] | null;
  }[];

  return rows.map((row) => {
    const student = studentFromJoin(row.students);
    return {
      id: row.id,
      invoice_number: row.invoice_number,
      amount_cents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      due_at: row.due_at,
      created_at: row.created_at,
      student_id: row.student_id,
      student_name: student.name,
      student_code: student.code,
    };
  });
}

export async function fetchCenterPayments(centerId: string): Promise<CenterPaymentRow[]> {
  const { data, error } = await getSupabase()
    .from("payments")
    .select(
      "id, amount_cents, currency, method, paid_at, invoice_id, invoices(invoice_number, students(full_name))"
    )
    .eq("center_id", centerId)
    .order("paid_at", { ascending: false });
  const rows = supabaseList(data, error) as unknown as {
    id: string;
    amount_cents: number;
    currency: string;
    method: string | null;
    paid_at: string;
    invoice_id: string | null;
    invoices:
      | { invoice_number: string | null; students: { full_name: string } | { full_name: string }[] | null }
      | { invoice_number: string | null; students: { full_name: string } | { full_name: string }[] | null }[]
      | null;
  }[];

  return rows.map((row) => {
    const invoice = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;
    const student = studentFromJoin(invoice?.students ?? null);
    return {
      id: row.id,
      amount_cents: row.amount_cents,
      currency: row.currency,
      method: row.method,
      paid_at: row.paid_at,
      invoice_id: row.invoice_id,
      invoice_number: invoice?.invoice_number ?? null,
      student_name: invoice ? student.name : null,
    };
  });
}

export async function createCenterInvoice(input: CreateCenterInvoiceInput): Promise<string> {
  const { data, error } = await getSupabase()
    .from("invoices")
    .insert({
      brand_id: input.brandId,
      center_id: input.centerId,
      student_id: input.studentId,
      invoice_number: input.invoiceNumber?.trim() || null,
      amount_cents: input.amountCents,
      currency: "INR",
      status: input.status ?? "sent",
      due_at: input.dueAt ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function recordCenterPayment(input: RecordCenterPaymentInput): Promise<void> {
  const sb = getSupabase();

  const { error: insertError } = await sb.from("payments").insert({
    brand_id: input.brandId,
    center_id: input.centerId,
    invoice_id: input.invoiceId,
    amount_cents: input.amountCents,
    currency: "INR",
    method: input.method?.trim() || null,
    paid_at: input.paidAt ?? new Date().toISOString(),
  });
  if (insertError) throw insertError;

  const { data: invoice, error: invoiceError } = await sb
    .from("invoices")
    .select("amount_cents, status")
    .eq("id", input.invoiceId)
    .eq("center_id", input.centerId)
    .single();
  if (invoiceError) throw invoiceError;

  const { data: paymentRows, error: paymentsError } = await sb
    .from("payments")
    .select("amount_cents")
    .eq("invoice_id", input.invoiceId)
    .eq("center_id", input.centerId);
  if (paymentsError) throw paymentsError;

  const paidTotal = (paymentRows ?? []).reduce((sum, row) => sum + (row.amount_cents as number), 0);
  const nextStatus = computeInvoiceStatusAfterPayment(
    invoice.amount_cents as number,
    paidTotal,
    invoice.status as InvoiceStatus
  );

  const { error: updateError } = await sb
    .from("invoices")
    .update({ status: nextStatus })
    .eq("id", input.invoiceId)
    .eq("center_id", input.centerId);
  if (updateError) throw updateError;
}
