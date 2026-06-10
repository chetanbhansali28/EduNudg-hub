import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: batch, error } = await supabase.rpc("process_merchandise_payment_reminders");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let emailsSent = 0;
  if (resendKey) {
    const { data: pending } = await supabase
      .from("merchandise_reminder_log")
      .select("id, recipient_email, reminder_type, metadata, brand_id, center_id, order_id")
      .eq("channel", "email")
      .is("recipient_email", null)
      .order("sent_at", { ascending: false })
      .limit(50);

    for (const row of pending ?? []) {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("center_id", row.center_id)
        .eq("status", "active");

      for (const m of memberships ?? []) {
        const { data: user } = await supabase.auth.admin.getUserById(m.user_id);
        const email = user?.user?.email;
        if (!email) continue;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "EduNudg <noreply@edunudg.com>",
            to: email,
            subject: `Merchandise payment reminder (${row.reminder_type})`,
            text: `Please review your merchandise order ${row.order_id} in the center portal.`,
          }),
        });
        emailsSent += 1;

        await supabase
          .from("merchandise_reminder_log")
          .update({ recipient_email: email })
          .eq("id", row.id);
        break;
      }
    }
  }

  return new Response(
    JSON.stringify({ batch, emails_sent: emailsSent, email_provider: resendKey ? "resend" : "stub" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
