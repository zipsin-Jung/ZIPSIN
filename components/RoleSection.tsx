'use client';
import {useState} from 'react';
import {Check,ArrowRight,Building2,KeyRound,House,Wrench} from 'lucide-react';
import {roles,type Role} from '@/lib/data';
import {Tabs,TabsList,TabsTrigger,TabsContent} from './ui/tabs';
import PhoneDemo from './PhoneDemo';
const icons={agent:Building2,owner:KeyRound,tenant:House,repair:Wrench};
export default function RoleSection(){const[role,setRole]=useState<Role>('agent');return <section id="roles" className="section roles-section"><div className="container"><div className="section-heading"><span className="eyebrow">같은 집, 서로 다른 역할</span><h2>당신의 역할에 맞는<br className="mobile-break"/> 집신을 만나보세요.</h2><p>필요한 정보가 다르니까, 첫 화면도 다르게.</p></div><Tabs value={role} onValueChange={v=>setRole(v as Role)}><TabsList className="role-tabs">{(Object.keys(roles) as Role[]).map(key=>{const Icon=icons[key];return <TabsTrigger key={key} value={key}><Icon size={18}/>{roles[key].label}</TabsTrigger>})}</TabsList>{(Object.keys(roles) as Role[]).map(key=><TabsContent key={key} value={key}><div className="role-content"><div className="role-copy"><span className="role-kicker">집신 for {roles[key].label}</span><h3>{roles[key].title.split('\n').map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>)}</h3><p>{roles[key].description}</p><ul>{roles[key].points.map(p=><li key={p}><Check size={18}/>{p}</li>)}</ul><a className="text-link" href="#signup">나에게 맞는 집신 시작하기 <ArrowRight size={18}/></a></div><div className="role-phone"><PhoneDemo key={key} role={key}/></div></div></TabsContent>)}</Tabs></div></section>}
