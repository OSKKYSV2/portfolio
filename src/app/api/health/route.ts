// Edge runtime
export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: 'health(app+edge)' }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
