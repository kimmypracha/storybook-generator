// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2"
import { OpenAI } from "npm:openai@4.8.0"

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

// Initialize Supabase Client to access Storage
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

console.info('server started');

Deno.serve(async (req: Request) => {
  // Webhooks from Supabase usually send the record in this structure
  const payload = await req.json();
  const record = payload.record;

  // 1. Skip if already processing or completed to prevent loops
  if (record.status === 'complete' || record.image_url) {
    return new Response("Already processed", { status: 200 });
  }

  try {
    // 2. Generate Image
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Children's book illustration, vibrant colors, whimsical style: ${record.content_text}`,
      n: 1,
      size: "1024x1024",
    });
    
    const tempImageUrl = imageResponse.data[0].url;
    const imageFetch = await fetch(tempImageUrl!);
    const imageBlob = await imageFetch.blob();

    // 3. Upload to Storage
    const fileName = `${record.story_id}/${record.id}.png`; // Better file naming structure
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBlob, { contentType: 'image/png', upsert: true });

    if (uploadError) throw uploadError;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
  
    // 5. Update Database (This triggers the Frontend Realtime)
    const { error: updateError } = await supabase
      .from('pages')
      .update({
        image_url: publicUrl, 
        status: 'complete' // Match this with your frontend check
      })
      .eq("id", record.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Error in image-generation:", err.message);
    // Important: Update status to 'error' so the frontend doesn't wait forever
    await supabase.from('pages').update({ status: 'error' }).eq("id", record.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});