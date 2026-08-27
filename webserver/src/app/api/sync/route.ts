import { syncPlayerMatchesUseCase } from '@/infrastructure/container';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const summary = await syncPlayerMatchesUseCase.execute();
    return Response.json(summary);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error desconocido sincronizando partidas' },
      { status: 500 }
    );
  }
}
