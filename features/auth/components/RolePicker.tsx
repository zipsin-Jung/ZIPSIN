'use client';

import { useState, useTransition } from 'react';
import { savePrimaryRole } from '@/features/auth/actions/save-role';
import { ROLE_OPTIONS } from '@/features/auth/domain/roles';
import type { PrimaryRole } from '@/features/auth/domain/profile';

type Props = { onSave?: (role: PrimaryRole) => Promise<unknown> };

export function RolePicker({ onSave = savePrimaryRole }: Props) {
  const [selected, setSelected] = useState<PrimaryRole | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <fieldset className="grid gap-3">
        <legend className="sr-only">주 역할</legend>
        {ROLE_OPTIONS.map((role) => (
          <label className="flex min-h-24 cursor-pointer gap-4 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50" key={role.id}>
            <input aria-label={role.label} checked={selected === role.id} name="role" onChange={() => setSelected(role.id)} type="radio" value={role.id} />
            <span><strong className="block text-lg">{role.label}</strong><span className="mt-1 block text-slate-600">{role.description}</span><small className="mt-2 block text-slate-500">{role.requiresInvitationNotice}</small></span>
          </label>
        ))}
      </fieldset>
      <button
        className="mt-6 min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
        disabled={!selected || isPending}
        onClick={() => selected && startTransition(async () => { await onSave(selected); })}
        type="button"
      >
        이 역할로 시작하기
      </button>
    </div>
  );
}
