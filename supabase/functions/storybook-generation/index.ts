import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { OpenAI } from "npm:openai@4.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const { prompt } = await req.json()


  
  // Refined instruction to ensure clean XML-like tags for easier parsing
  const instruction  = `You are a well-known storybook writer for kids. Your task is to take the given kid's response from a quiz to build a storybook with 10-15 pages. 
   For each page, you must keep the text concise, easy to read for kids, no more than 3 sentences per pages.
    Your output must strictly follow this format: 
    <title>Your Story Title Here</title>
    <page>Page 1 content here...</page>
    <page>Page 2 content here...</page>
    ...
    `

  // 1. Generate Text (Story Content)
  const chatResponse = await openai.chat.completions.create({
      model: "gpt-5-mini", // or gpt-4 for better adherence to format
      messages: [
        { role: "system", content: instruction},
        { role: "user", content: prompt }
      ]
    })

  const rawContent = chatResponse.choices[0].message.content

  // --- START PARSING LOGIC ---
  
  // 1. Extract Title
  const titleMatch = rawContent.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : "Untitled Story"

  // 2. Extract Pages
  const pageMatches = [...rawContent.matchAll(/<page>([\s\S]*?)<\/page>/gi)]
  
  // Map matches to a clean array of strings
  const pagesText = pageMatches.map(match => match[1].trim())

  if (pagesText.length === 0) {
    console.error("Failed to parse pages. Raw content:", rawContent)
    return new Response(JSON.stringify({ error: "AI failed to generate valid page format" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
  // --- END PARSING LOGIC ---

  // --- START DATABASE SAVING ---

  // 3. Insert Story (Parent)
  const { data: storyData, error: storyError } = await supabase
    .from('stories')
    .insert({ 
        title: title,
        uid: "228c7231-532b-4eb6-9ca7-12b28cdacc60"
        // storing the raw output just in case parsing failed partially
        // raw_content: rawContent 
    })
    .select()
    .single()

  if (storyError) {
    console.error(storyError)
    return new Response(JSON.stringify({ error: "Failed to save story" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }

  // 4. Prepare Pages (Children)
  // We attach the story_id we just got to every page row
  const pageRows = pagesText.map((text, index) => ({
    story_id: storyData.id,
    page_num: index + 1,
    content_text: text,
    // If you want the image worker to use the text as the prompt, 
    // copy text to image_prompt, or leave it for the worker to summarize.
    image_url: null,
    status: 'pending' // This status is what your frontend tracks!
  }))

  // 5. Bulk Insert Pages
  // CRITICAL: This INSERT will trigger your 'pages' webhook to start generating images in parallel
  const { error: pagesError } = await supabase
    .from('pages')
    .insert(pageRows)

  if (pagesError) {
    console.error(pagesError)
    return new Response(JSON.stringify({ error: "Failed to save pages" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }

  // --- END DATABASE SAVING ---

  return new Response(JSON.stringify({
    success: true,
    storyId: storyData.id,
    title: title,
    pagesText: pagesText,
    pageCount: pagesText.length,
    message: "Story created. Image generation has started in the background."
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})