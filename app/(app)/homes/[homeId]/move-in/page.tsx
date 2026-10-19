import { renderOverview } from '@/features/inspections/components/inspection-pages';

type Props = { params: Promise<{ homeId: string }>; searchParams?: Promise<{ error?: string; sent?: string; confirm?: string }> };

export default function Page({ params, searchParams }: Props) {
  return renderOverview('move_in', params, searchParams);
}
