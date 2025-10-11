// Enable Supabase Edge Runtime type definitions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialise Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Instantly acknowledge webhook, process in background
Deno.serve((req: Request) => {
  processUpload(req.clone()); // Process body separately
  return new Response('Acknowledged', { status: 200 }); // Immediate 200 OK
});

// Background function to process upload
async function processUpload(req: Request) {
  try {
    const { name, bucket_id } = await req.json();
    console.log("Background processing started:", { name, bucket_id });

    if (!name || !bucket_id) {
      console.error("Missing name or bucket_id in event payload.");
      return;
    }

    // Parse UUID from filename
    const submissionId = name.replace(".pdf", "");

    if (!submissionId || submissionId.length !== 36) {
      console.error("Filename does not contain a valid UUID:", submissionId);
      return;
    }

    console.log(`Parsed submission ID: ${submissionId}`);

    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('id, user_id')
      .eq('id', submissionId)
      .eq('status', 'pending')
      .maybeSingle();

    if (findError) {
      console.error("Error querying submissions:", findError);
      return;
    }

    if (!submission) {
      console.error("No matching pending submission found.");
      return;
    }

    console.log(`Matched submission ID: ${submission.id}`);

    const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${bucket_id}/${name}`;

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ report_url: fileUrl, status: 'completed' })
      .eq('id', submission.id);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return;
    }

    console.log(`Submission ${submission.id} updated successfully.`);

  } catch (err) {
    console.error("Unexpected error during background processing:", err);
  }
}
