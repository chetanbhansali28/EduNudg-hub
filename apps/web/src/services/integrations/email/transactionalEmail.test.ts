import { describe, expect, it } from "vitest";
import { renderMerchandiseReminderBody, renderMerchandiseReminderSubject } from "./transactionalEmail";

describe("transactionalEmail", () => {
  it("regression_reminder_subject_overdue", () => {
    expect(renderMerchandiseReminderSubject("overdue", "Spark Academy")).toContain("Overdue");
  });

  it("regression_reminder_body_includes_amount", () => {
    const body = renderMerchandiseReminderBody(
      {
        brandName: "Spark Academy",
        centerName: "Pune Center",
        orderId: "order-uuid-123",
        amountFormatted: "₹1,500",
        portalUrl: "https://center.example/app/merchandise",
      },
      "due_today"
    );
    expect(body).toContain("₹1,500");
    expect(body).toContain("Pune Center");
  });
});
