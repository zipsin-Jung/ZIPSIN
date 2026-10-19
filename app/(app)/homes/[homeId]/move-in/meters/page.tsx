import { renderMeters } from '@/features/inspections/components/inspection-pages';

type Props = { params: Promise<{ homeId: string }>; searchParams?: Promise<{ error?: string; saved?: string }> };

export default function Page({ params, searchParams }: Props) {
  return renderMeters('move_in', params, searchParams);
}
