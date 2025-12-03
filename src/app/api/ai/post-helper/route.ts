import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCaption = body?.rawCaption as string | undefined;
    const currentTitle = body?.currentTitle as string | undefined;

    if (!rawCaption) {
      return NextResponse.json(
        { error: "rawCaption is required" },
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

    const prompt = `
You help visual artists on a social network called MuseUp write better post titles and descriptions.

The user gives you:
- A rough description of their artwork (caption)
- A current / rough title (can be empty)

You MUST respond ONLY with a valid JSON object, no explanations, no markdown, no extra text.
The JSON structure must be exactly:

{
  "improvedDescription": "2-4 sentences, clear, warm, slightly poetic but not cringe.",
  "suggestedTitle": "Short catchy title, max 7 words.",
  "shortCaption": "One short line for social caption, max 120 characters."
}

Here is the data from the user:
- Current title: ${currentTitle || "(empty)"}
- Raw description: ${rawCaption}
`.trim();

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        "Gemini API error (no message)";
      console.error("Gemini API error:", data);
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const candidates = (data as any).candidates || [];
    const first = candidates[0];
    const parts = first?.content?.parts || [];
    const text: string =
      parts
        .map((p: any) => p.text)
        .filter(Boolean)
        .join("\n\n") || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse Gemini JSON, raw text:", text);
      parsed = {};
    }
    const improvedDescription: string =
      typeof parsed.improvedDescription === "string" &&
      parsed.improvedDescription.trim()
        ? parsed.improvedDescription
        : rawCaption;
    const suggestedTitle: string =
      typeof parsed.suggestedTitle === "string" &&
      parsed.suggestedTitle.trim()
        ? parsed.suggestedTitle
        : "Untitled artwork";
    const shortCaption: string =
      typeof parsed.shortCaption === "string" &&
      parsed.shortCaption.trim()
        ? parsed.shortCaption
        : improvedDescription.slice(0, 120);
    return NextResponse.json({
      improvedDescription,
      suggestedTitle,
      shortCaption,
    });
  } catch (err) {
    console.error("AI post-helper error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
