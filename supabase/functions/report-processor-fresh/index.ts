import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialise Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (_req: Request) => {
  try {
    console.log("Scheduled report processing started...");

    // List all files in 'documents' bucket
    const { data: files, error: listError } = await supabase.storage.from('documents').list('', { limit: 1000 });

    if (listError) {
      console.log("Error listing files in documents bucket:", listError);
      return new Response("Failed to list files", { status: 500 });
    }

    if (!files || files.length === 0) {
      console.log("No files found in documents bucket.");
      return new Response("No files to process", { status: 200 });
    }

    console.log(`Found ${files.length} files to process.`);

    for (const file of files) {
      try {
        const { name } = file;
        if (!name.endsWith('.pdf')) {
          console.log(`Skipping non-PDF file: ${name}`);
          continue;
        }

        const submissionId = name.replace('.pdf', '');

        if (!submissionId || submissionId.length !== 36) {
          console.log(`Invalid UUID filename: ${name}`);
          continue;
        }

        console.log(`Processing file: ${name} → Submission ID: ${submissionId}`);

        const { data: submission, error: findError } = await supabase
          .from('submissions')
          .select('id, user_id')
          .eq('id', submissionId)
          .eq('status', 'pending')
          .maybeSingle();

        if (findError) {
          console.log("Error querying submission:", findError);
          continue;
        }

        if (!submission) {
          console.log(`No pending submission found for ID: ${submissionId}`);
          continue;
        }

        const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/documents/${name}`;

        const { error: updateError } = await supabase
          .from('submissions')
          .update({ report_url: fileUrl, status: 'completed' })
          .eq('id', submission.id);

        if (updateError) {
          console.log(`Error updating submission ID ${submission.id}:`, updateError);
          continue;
        }

        console.log(`Submission ${submission.id} updated successfully.`);

        // NEW: Fetch user email and send notification
        console.log(`Sending email for submission ID ${submission.id}`);

        const resendApiKey = Deno.env.get("RESEND_API_KEY");

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', submission.user_id)
          .maybeSingle();

        if (userError || !user || !user.email) {
          console.log(`Error fetching user email for submission ID ${submission.id}:`, userError);
          continue;
        }

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "hello@syndeticai.com", // Replace with your verified sender email
            to: user.email,
            subject: "Your Report is Ready!",
            html: `
              <p>Hi,</p>
              <p>Your report is now ready to download. Please log in to the platform to view it.</p>
              <p>Thank you,<br>VC Signal Team</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.log(`Failed to send email to ${user.email}`, await emailResponse.text());
        } else {
          console.log(`Email successfully sent to ${user.email}`);
        }

      } catch (fileErr) {
        console.log("Unexpected error processing a file:", fileErr);
      }
    }

    console.log("Scheduled processing completed successfully.");
    return new Response("Scheduled processing completed", { status: 200 });

  } catch (err) {
    console.log("Unexpected error in scheduled processing:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
