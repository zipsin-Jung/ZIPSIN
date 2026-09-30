'use client';
import {useState} from 'react';
import type {Plan} from '@/lib/data';
import Header from './Header';import Hero from './Hero';import ProblemSection from './ProblemSection';import FeatureSection from './FeatureSection';import RoleSection from './RoleSection';import ZSection from './ZSection';import PricingSection from './PricingSection';import SignupSection from './SignupSection';import Footer from './Footer';
export default function LandingPage(){const[plan,setPlan]=useState<Plan>('FREE');const[revision,setRevision]=useState(0);function select(p:Plan){setPlan(p);setRevision(v=>v+1);document.getElementById('signup')?.scrollIntoView({behavior:'smooth'});}return <><a className="skip-link" href="#main">본문 바로가기</a><Header/><main id="main"><Hero/><ProblemSection/><FeatureSection/><RoleSection/><ZSection/><PricingSection onSelect={select}/><SignupSection plan={plan} onPlanChange={setPlan} revision={revision}/></main><Footer/></>}
