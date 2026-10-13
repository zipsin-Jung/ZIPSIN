export function normalizePhone(value?:string){if(!value)return undefined;const digits=value.replace(/\D/g,'');return /^(01[016789]\d{7,8}|0[2-6]\d{7,9})$/.test(digits)?digits:undefined}
export function safeListingUrl(value?:string){if(!value)return undefined;try{const url=new URL(value);return url.protocol==='http:'||url.protocol==='https:'?url:undefined}catch{return undefined}}
