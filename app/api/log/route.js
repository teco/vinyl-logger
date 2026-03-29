const NOTION_DB_ID = '3c079b18f4574ec6a35e446b146d60a3';

export async function POST(req) {
  const { title, artist, format, genres } = await req.json();

  const properties = {
    Title: { title: [{ text: { content: title } }] },
    Artist: { rich_text: [{ text: { content: artist } }] },
    Format: { select: { name: format } },
    ...(genres?.trim() && {
      Genre: { rich_text: [{ text: { content: genres.trim() } }] },
    }),
  };

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json({ error: data.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}