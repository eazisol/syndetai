import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialise Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
console.log('Test', Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (_req: Request) => {
  try {
    console.log("Scheduled report processing started...");

    // List all files in 'documents' bucket (new clean bucket)
    const { data: files, error: listError } = await supabase.storage.from('documents').list('', { limit: 1000 });

    if (listError) {
      console.error("Error listing files in documents bucket:", listError);
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
          console.error(`Invalid UUID filename: ${name}`);
          continue;
        }

        console.log(`Processing file: ${name} → Submission ID: ${submissionId}`);

        const { data: submission, error: findError } = await supabase
          .from('submissions')
          .select('id')
          .eq('id', submissionId)
          .eq('status', 'pending')
          .maybeSingle();

        if (findError) {
          console.error("Error querying submission:", findError);
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
          console.error(`Error updating submission ID ${submission.id}:`, updateError);
          continue;
        }

        console.log(`Submission ${submission.id} updated successfully.`);

      } catch (fileErr) {
        console.error("Unexpected error processing a file:", fileErr);
      }
    }

    console.log("Scheduled processing completed successfully.");
    return new Response("Scheduled processing completed", { status: 200 });

  } catch (err) {
    console.error("Unexpected error in scheduled processing:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
