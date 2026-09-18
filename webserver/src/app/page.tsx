import { getRankingPageDataUseCase } from '@/infrastructure/container';
import { RankingClient } from '@/ui/RankingClient';

export const revalidate = 60;

export default async function Home() {
  const initialData = await getRankingPageDataUseCase.execute();
  return <RankingClient initialData={initialData} />;
}
