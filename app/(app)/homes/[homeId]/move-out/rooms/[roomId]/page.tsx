import { renderRoom } from '@/features/inspections/components/inspection-pages';

type Props = { params: Promise<{ homeId: string; roomId: string }>; searchParams?: Promise<{ error?: string; aspect?: string; item?: string }> };

export default function Page({ params, searchParams }: Props) {
  return renderRoom('move_out', params, searchParams);
}
