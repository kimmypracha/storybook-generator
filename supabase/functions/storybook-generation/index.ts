import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { OpenAI } from "npm:openai@4.8.0";
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});
// Initialize Supabase Client to access Storage
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(async (req)=>{
  const { prompt } = await req.json();
  // 1. Generate Text and Image URL in parallel
  const [chatResponse, imageResponse] = await Promise.all([
    openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }),
    openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: 'url' // Get the temporary URL first
    })
  ]);
  const tempImageUrl = imageResponse.data[0].url;
  // 2. Fetch the image data from the temporary URL
  const imageFetch = await fetch(tempImageUrl);
  const imageBlob = await imageFetch.blob();
  // 3. Upload to Supabase Storage
  const fileName = `generated-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage.from('images') // Ensure this bucket exists in Supabase
  .upload(fileName, imageBlob, {
    contentType: 'image/png'
  });
  if (uploadError) {
    console.error(uploadError);
    return new Response(JSON.stringify({
      error: "Failed to upload image"
    }), {
      status: 500
    });
  }
  // 4. Get the Permanent Public URL
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
  return new Response(JSON.stringify({
    text: chatResponse.choices[0].message.content,
    image: publicUrl // This URL is permanent
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
