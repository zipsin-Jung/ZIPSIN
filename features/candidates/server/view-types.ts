import type {createCandidateService} from './service';
export type AwaitedCandidate=NonNullable<Awaited<ReturnType<ReturnType<typeof createCandidateService>['getCandidateDraft']>>>;
