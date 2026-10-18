"use client";
import { useState, type FormEvent } from "react";
import {
  createOfficeInvitationAction,
  revokeOfficeInvitationAction,
  type InvitationFormState,
} from "@/features/invitations/actions/create-office-invitation";

export function OfficeInviteForm({ officeId }: { officeId: string }) {
  const [state, setState] = useState<InvitationFormState>({});
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});
    try {
      setState(
        await createOfficeInvitationAction(new FormData(event.currentTarget)),
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="app-panel rounded-[28px] p-6 sm:p-8">
      <input type="hidden" name="officeId" value={officeId} />
      <label htmlFor="role" className="font-bold text-[#16211E]">
        초대할 역할
      </label>
      <select
        id="role"
        name="role"
        className="mt-3 min-h-14 w-full rounded-2xl border border-[#E1E6E3] bg-white px-4 text-[#16211E]"
      >
        <option value="associate_broker">소속공인중개사</option>
        <option value="assistant">중개보조원</option>
      </select>
      <p className="mt-3 text-sm leading-6 text-[#5D6A65]">
        초대는 48시간 동안 한 번만 사용할 수 있습니다. 비밀번호를 공유하지
        않습니다.
      </p>
      <button
        disabled={pending}
        className="app-primary mt-6 min-h-14 w-full rounded-2xl font-bold text-white disabled:opacity-60"
      >
        {pending ? "만드는 중…" : "보안 초대 링크 만들기"}
      </button>
      {state.error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      {state.invitePath && (
        <div className="mt-5 rounded-2xl border border-[#b9ded5] bg-[#E3F0EC] p-4">
          <p className="text-sm font-bold text-[#3E4B47]">
            초대 링크가 만들어졌습니다
          </p>
          <code className="mt-2 block break-all text-xs text-[#5D6A65]">
            {state.invitePath}
          </code>
          {state.invitationId && (
            <button type="button" onClick={async () => setState(await revokeOfficeInvitationAction(state.invitationId!))} className="mt-4 text-sm font-bold text-red-700">
              이 초대 철회하기
            </button>
          )}
        </div>
      )}
    </form>
  );
}
