import { listDecisions, runtimeEnv } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const db = runtimeEnv().DB;
  if (!db) return Response.json({ mode: 'simulation', decisions: [], message: 'D1 is not bound in this environment.' });
  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 50);
  return Response.json({ mode: 'persisted', decisions: await listDecisions(db, limit) });
}
