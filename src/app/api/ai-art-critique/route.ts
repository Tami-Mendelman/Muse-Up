import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image_url = body?.image_url as string | undefined;
    if (!image_url) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      );
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const mimeType =
      imgRes.headers.get("content-type") || "image/jpeg";
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
const prompt = `
You are a concise and supportive art critic.
Return the critique EXACTLY in this format, with each section on its own separate line:

• What works:
- One short sentence.

 What could be improved:
- One short sentence.

Rules:
- Do NOT place both bullets on the same line.
- Add a line break between the two sections.
- Max 4 total lines.
- No intro, no outro.
Only return the formatted lines above.
`;
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini error:", result);
      return NextResponse.json(
        {
          error:
            result.error?.message ||
            "Failed to generate critique",
        },
        { status: 500 }
      );
    }
    const parts = result.candidates?.[0]?.content?.parts || [];
    const text =
      parts
        .map((p: any) => p.text)
        .filter(Boolean)
        .join("\n\n") || "לא התקבלה ביקורת מה-AI.";
    return NextResponse.json({ critique: text });
  } catch (err) {
    console.error("AI critique error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
