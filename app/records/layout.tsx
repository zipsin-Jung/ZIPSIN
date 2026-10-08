import RecordsHeader from '@/components/records/RecordsHeader';
export const dynamic = 'force-dynamic';
export default function RecordsLayout({children}:{children:React.ReactNode}){return <div className="records-shell"><RecordsHeader/><main className="records-main">{children}</main><footer className="records-footer">© 2026 ZIPSIN · 가상 수리 기록 CRUD 데모</footer></div>}
