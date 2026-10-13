import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'app/(app)/homes/[homeId]/assignees/page.tsx'),
  'utf8',
);

describe('retired home assignment route', () => {
  it('redirects to the home and cannot call assignment actions', () => {
    expect(source).toMatch(/redirect\(`\/homes\/\$\{homeId\}`\)/);
    expect(source).not.toMatch(/assignOfficeMemberAction|endOfficeAssignmentAction|office_home_assignments/);
    expect(source).not.toContain('담당자 관리');
  });
});
