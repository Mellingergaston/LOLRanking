import { getPlayerProfileUseCase } from '@/infrastructure/container';
import { ProfileView } from '@/ui/profile/ProfileView';

export const dynamic = 'force-dynamic';

export default async function PlayerProfilePage({ params }: { params: Promise<{ riotId: string }> }) {
  const { riotId: encodedRiotId } = await params;
  const riotId = decodeURIComponent(encodedRiotId);
  const profile = await getPlayerProfileUseCase.execute(riotId);

  return <ProfileView profile={profile} />;
}
