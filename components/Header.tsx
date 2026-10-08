'use client';
import {useState} from 'react';
import {Menu,X,ArrowUpRight} from 'lucide-react';
import Brand from './Brand';
import {Button} from './ui/button';
const links=[['why','왜 집신인가요'],['features','주요 기능'],['roles','역할별 소개'],['pricing','요금제'],['signup','사전가입']];
export default function Header(){const[open,setOpen]=useState(false);return <header className="header"><div className="container header-inner"><a href="#" aria-label="집신 처음으로"><Brand/></a><nav className="desktop-nav" aria-label="주 메뉴">{links.map(([id,label])=><a key={id} href={`#${id}`}>{label}</a>)}<a href="/records">수리 기록 데모</a></nav><Button asChild className="header-cta"><a href="#signup">사전 회원 가입 하기 <ArrowUpRight size={16}/></a></Button><button className="menu-toggle" aria-label={open?'메뉴 닫기':'메뉴 열기'} aria-expanded={open} aria-controls="mobile-nav" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>{open&&<nav id="mobile-nav" className="mobile-nav" aria-label="모바일 메뉴">{links.map(([id,label])=><a key={id} href={`#${id}`} onClick={()=>setOpen(false)}>{label}</a>)}<a href="/records">수리 기록 데모</a></nav>}</header>}
