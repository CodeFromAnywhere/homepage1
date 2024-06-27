import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const defaultConfig = `ChatGPT:https://chatgpt.com/?q=%s
Exa:https://exa.ai/search?q=%s
Perplexity:https://www.perplexity.ai/search?q=%s
Google:https://www.google.com/search?q=%s`;

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const config = searchParams.get("config") || defaultConfig;

  if (!q) {
    return new Response("Missing query parameter", { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",

      messages: [
        {
          role: "system",
          content: `You are a AI redirect engine. You redirect the user to the right search engine, depending on the query. For open questions, use ChatGPT. For news questions, use perplexity. For similarity questions, use Exa. All else, use Google.

The possibilities are as follows:

${config}

The user search query: ${q}

Respond with a JSON object {"url":"The redirect url"}.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });

    const resultMessage = completion.choices[0].message.content;
    console.log({ completion, resultMessage });
    if (!resultMessage) {
      return new Response("Something went wrong.No message.", { status: 400 });
    }
    try {
      const object = JSON.parse(resultMessage);
      const url = object.url;

      console.log({ url });
      return new Response("Redirecting...", {
        status: 302,
        headers: { Location: url },
      });
    } catch (e) {
      console.log(e);
      return new Response("Couldn't parse JSON", { status: 400 });
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return new Response("Error processing your request", { status: 500 });
  }
};
