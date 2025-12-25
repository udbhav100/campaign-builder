
// This route is deprecated and removed. 
// The application now uses direct client-side calls to the Gemini API in src/services/gemini.ts
// to ensure reliability in environments without server-side capabilities.
export async function POST(req: Request) {
  return new Response(JSON.stringify({ error: "Route removed" }), { status: 410 });
}
