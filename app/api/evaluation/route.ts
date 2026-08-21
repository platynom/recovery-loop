import { evaluatePolicies } from '@/eval/evaluate.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = Math.min(5000, Math.max(100, Number(url.searchParams.get('count') ?? 1000)));
  const outageBank = url.searchParams.get('outageBank') || null;
  return Response.json(evaluatePolicies({ count, seed: 20260822, outageBank, now: Date.UTC(2026, 7, 22, 6, 0, 0) }));
}
