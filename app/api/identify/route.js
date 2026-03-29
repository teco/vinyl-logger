export async function POST(req) {
  const { image, mimeType } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: `Identify this album cover.
Return ONLY a valid JSON object — no markdown, no explanation.
Schema: {"title":"string","artist":"string","format":"LP" or "CD","confidence":"high" or "low"}
- format: infer from visual cues (CD jewel case vs vinyl sleeve proportions)
- confidence "low" if you cannot identify with certainty; use empty strings for title and artist in that case.` }
        ]
      }]
    })
  });

  const data = await response.json();
  const raw = data.content?.find(b => b.type === 'text')?.text || '';

  let result;
  try {
    result = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    result = { title: '', artist: '', format: 'LP', confidence: 'low' };
  }

  return Response.json(result);
}
