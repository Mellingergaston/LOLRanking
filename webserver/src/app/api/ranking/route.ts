import { getRankingPageDataUseCase } from '@/infrastructure/container';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getRankingPageDataUseCase.execute();
  return Response.json(data);
}
