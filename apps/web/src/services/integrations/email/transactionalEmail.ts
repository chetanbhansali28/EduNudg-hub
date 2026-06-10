export type MerchandiseReminderEmailVars = {
  brandName: string;
  centerName: string;
  orderId: string;
  invoiceNumber?: string;
  amountFormatted: string;
  dueDate?: string;
  daysOverdue?: number;
  portalUrl: string;
};

export function renderMerchandiseReminderSubject(
  reminderType: string,
  brandName: string
): string {
  switch (reminderType) {
    case "invoice_issued":
      return `${brandName}: Merchandise invoice issued`;
    case "upcoming":
      return `${brandName}: Payment due in 3 days`;
    case "due_today":
      return `${brandName}: Merchandise payment due today`;
    case "overdue":
      return `${brandName}: Overdue merchandise payment`;
    case "overdue_escalation":
      return `${brandName}: Urgent — overdue merchandise payment`;
    case "payment_pending":
      return `${brandName}: Complete your merchandise payment`;
    default:
      return `${brandName}: Merchandise payment reminder`;
  }
}

export function renderMerchandiseReminderBody(vars: MerchandiseReminderEmailVars, reminderType: string): string {
  const lines = [
    `Hello ${vars.centerName},`,
    "",
    reminderType === "invoice_issued"
      ? `Your merchandise invoice ${vars.invoiceNumber ?? ""} for ${vars.amountFormatted} has been issued.`
      : `Reminder: merchandise order ${vars.orderId.slice(0, 8)} requires payment of ${vars.amountFormatted}.`,
  ];
  if (vars.dueDate) lines.push(`Due date: ${vars.dueDate}`);
  if (vars.daysOverdue) lines.push(`Overdue by ${vars.daysOverdue} day(s).`);
  lines.push("", `View orders: ${vars.portalUrl}`, "", `— ${vars.brandName}`);
  return lines.join("\n");
}
