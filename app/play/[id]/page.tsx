import { notFound } from "next/navigation";
import { GameClient } from "@/components/game/game-client";
import { getMission, MISSIONS } from "@/lib/missions";

export function generateStaticParams() {
  return MISSIONS.map((mission) => ({ id: mission.id }));
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) notFound();
  return <GameClient key={mission.id} mission={mission} />;
}
