export const runtime = 'edge';

export async function GET() {
  return new Response(
    JSON.stringify({ message: 'Hello from Edge Runtime!' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}
