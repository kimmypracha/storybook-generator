<a href="">
  <h1 align="center">Story Book Generator App</h1>
</a>

<p align="center">
 Generating a storybook for children with AI
</p>

<p align="center">
  <a href="#setup-instruction"><strong>Setup Instruction</strong></a> ·
  <a href="#key-design-decisions-and-tradeoffs"><strong>Key design decisions and tradeoffs</strong></a>
</p>
<br/>
## Demo Website

You can go to the demo website [here](https://storybook-generator-mauve.vercel.app/) 

## Setup Instruction

1. create `.env` or `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
If you need the secret for testing please contact the author. 
2. Install all dependencies 
 ```bash
   npm install
   ```
3. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The web application should now be running on [localhost:3000](http://localhost:3000/).



## Key design decisions and tradeoffs

1. **UX flow** : We use the quiz format instead of using a generic fill-form experience. This would help to improve the interaction between teacher/parent with childrens, by asking them a few questions. However, the questions are currently limited comparing to the other choices like chat-style, but quiz-format could be a good way to help as ice-breaker. In the future, we could expand further on making a dynamic quiz, or making quiz AI-generated under some constraints. 
2.  **Tech stack** : We use Next.js with Supabase as database. The reason we use these tech stack are because of three main factors, speed of development, flexibility, and maturity. Nextjs provide a good options for improving the user experience with large amount of library supported. Next.js has a big community, if we need to find collaborator, it would be easier to find. Additionally, I do have most experience in web development in React/Next.js. 
3.  **Data Model** : For database, since we are building MVP, the plan is to launch a working system quickly, so Supabase is one of my first option. Supabase also provide Authentication out of the box, and available on cloud without the need to deploy on separate instance. Additionally, it also provide edge functions, which allowing us to run a few process in the background and off-loading the heavy tasks like image generation or AI generation. For the decision between SQL vs NoSQL, I found SQL to be more straighforward, and providing consistent structured way, especially with the data we currently have, the format is quite simple that it does not need NOSQL format.
4.  **How AI is used** : I use OpenAI `gpt-5-mini` model to generate the data from a "seed" text. The "seed" text are from the quiz's answer. We compile them in to a pair of question and answer, then ask the model to generate a story in a structure including title and pages. Once we have the specified format, we parse them into a list of story pages. Once we inserted the pages data, it will trigger the Supabase edge function to do image generation and update the status once it's done. To generate the image, we use OpenAI `dall-e-3` model to generate the image with addtional prompt to enforce a specific aesthetic for the children storybook. 
