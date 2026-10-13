export function formatWon(value?:number){if(value===undefined)return '미입력';if(value===0)return '0원';if(value%10_000===0)return `${value/10_000}만원`;return `${value.toLocaleString('ko-KR')}원`}
export function monthlyHousingCost(rent?:number,maintenance?:number){return rent===undefined||maintenance===undefined?undefined:rent+maintenance}
export function formatRentalPrice(deposit?:number,rent?:number){if(deposit===undefined&&rent===undefined)return '미입력';return `보증금 ${formatWon(deposit)} · 월세 ${formatWon(rent)}`}
