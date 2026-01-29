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
  const { record } = await req.json();
  

  const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: record.content_text,
      n: 1,
      size: "1024x1024",
      response_format: 'url' // Get the temporary URL first
    });
  const tempImageUrl = imageResponse.data[0].url

  // Fetch the image data from the temporary URL
  const imageFetch = await fetch(tempImageUrl!)
  const imageBlob = await imageFetch.blob()

  const fileName = `generated-${Date.now()}.png`
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('images') // Ensure this bucket exists in Supabase
    .upload(fileName, imageBlob, {
      contentType: 'image/png'
    })

  if (uploadError) {
    console.error(uploadError)
    return new Response(JSON.stringify({ error: "Failed to upload image" }), { status: 500 })
  }

  // 4. Get the Permanent Public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('images')
    .getPublicUrl(fileName)
  
  const {error: pagesError} = await supabase
    .from('pages')
    .update({
      image_url: publicUrl, 
      status: 'complete'
    })
    .eq("id", record.id)

  if(pagesError) { 
    console.error(pagesError)
    return new Response(JSON.stringify({ error: "Failed to insert image url to table pages" }), { status: 500 })
  }

  // TODO : Do the final checking with the stories table later.

  return new Response(JSON.stringify({
    image: publicUrl // This URL is permanent
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
});
