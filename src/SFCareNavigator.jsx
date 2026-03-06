import { useState, useRef, useEffect, useCallback } from "react";

(() => {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";
  l.rel = "stylesheet";
  document.head.appendChild(l);
})();



// ── LANGUAGE CONFIG ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { code:"en",  label:"English",     flag:"🇺🇸", speechCode:"en-US" },
  { code:"es",  label:"Español",     flag:"🇲🇽", speechCode:"es-US" },
  { code:"zh",  label:"普通话",       flag:"🇨🇳", speechCode:"zh-CN" },
  { code:"yue", label:"廣東話",       flag:"🇭🇰", speechCode:"zh-HK" },
  { code:"tl",  label:"Tagalog",     flag:"🇵🇭", speechCode:"tl-PH" },
  { code:"vi",  label:"Tiếng Việt",  flag:"🇻🇳", speechCode:"vi-VN" },
  { code:"ru",  label:"Русский",     flag:"🇷🇺", speechCode:"ru-RU" },
  { code:"ar",  label:"العربية",     flag:"🇸🇦", speechCode:"ar-SA" },
];

const LANG_PATTERNS = [
  { code:"es", re:/[áéíóúüñ¿¡]/i },
  { code:"zh", re:/[\u4e00-\u9fff]/ },
  { code:"ar", re:/[\u0600-\u06ff]/ },
  { code:"ru", re:/[\u0400-\u04ff]/ },
  { code:"vi", re:/[àáảãạăắặẳẵâấầậẩẫđèéẻẽẹêếềệểễìíỉĩịòóỏõọôốồộổỗơớờợởỡùúủũụưứừựửữỳýỷỹỵ]/i },
];

// ── CLINICS ───────────────────────────────────────────────────────────────────
const CLINICS = {
  emergency: [
    { name:"Zuckerberg SF General Hospital", neighborhood:"Potrero Hill", address:"1001 Potrero Ave, 94110", phone:"415-206-8000", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["All languages via interpreter"], insurance:["All welcome — no one turned away"], note:"SF's only public hospital. Sanctuary city — safe for all immigration statuses. No one turned away. Financial assistance automatic for uninsured.", url:"https://zuckerbergsanfranciscogeneral.org" },
    { name:"UCSF Medical Center ER", neighborhood:"Inner Sunset", address:"505 Parnassus Ave, 94143", phone:"415-476-1037", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["Interpreters available"], insurance:["Most insurance","Financial assistance available"], note:"Ask admissions about the financial assistance program for uninsured patients.", url:"https://www.ucsfhealth.org" },
  ],
  urgent: [
    { name:"Mission Neighborhood Health Center", neighborhood:"Mission", address:"240 Van Ness Ave, 94102", phone:"415-552-3870", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Spanish","English"], insurance:["Medi-Cal","Healthy SF","Sliding scale","Uninsured welcome"], note:"Bilingual Spanish/English. Sliding scale fees — pay what you can. Primary pilot partner.", url:"https://www.mnhc.org" },
    { name:"Tom Waddell Urban Health Clinic", neighborhood:"Tenderloin", address:"230 Golden Gate Ave, 94102", phone:"415-355-7400", hours:{open:8,close:16.5}, hoursLabel:"Mon–Fri 8am–4:30pm", langs:["Spanish","Arabic","English","Interpreters"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Walk-in available. Arabic-speaking staff. Serves unhoused and uninsured residents.", url:"https://www.sf.gov/departments--department-public-health" },
    { name:"Chinatown Public Health Center", neighborhood:"Chinatown", address:"1490 Mason St, 94133", phone:"415-364-7900", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Cantonese","Mandarin","English"], insurance:["Medi-Cal","Healthy SF","Sliding scale"], note:"Cantonese and Mandarin-speaking staff. Primary care hub for Chinatown.", url:"https://www.sf.gov/departments--department-public-health" },
    { name:"Southeast Health Center", neighborhood:"Bayview / Excelsior", address:"2401 Keith St, 94124", phone:"415-671-7000", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Tagalog","Samoan","Spanish","English"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Tagalog and Samoan-speaking staff. Serves Bayview-Hunters Point and Excelsior.", url:"https://www.sf.gov/departments--department-public-health" },
    { name:"RAMS — Richmond Area Multi-Services", neighborhood:"Richmond", address:"3626 Balboa St, 94121", phone:"415-668-5955", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Cantonese","Mandarin","Russian","English"], insurance:["Medi-Cal","Sliding scale"], note:"Serves Richmond's large Chinese and Russian-speaking communities.", url:"https://www.ramsinc.org" },
    { name:"Potrero Hill Health Center", neighborhood:"Potrero Hill / SoMa", address:"1050 Wisconsin St, 94107", phone:"415-826-8400", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Spanish","English","Interpreters"], insurance:["Medi-Cal","Healthy SF","Sliding scale"], note:"DPH primary care close to ZSFG.", url:"https://www.sf.gov/departments--department-public-health" },
    { name:"North of Market Health Center", neighborhood:"Tenderloin / Nob Hill", address:"295 Turk St, 94102", phone:"415-474-7310", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["English","Spanish","Arabic","Vietnamese"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Highly diverse Tenderloin area. Middle Eastern and SE Asian populations.", url:"https://www.sfccc.org" },
  ],
  free: [
    { name:"Clinic by the Bay", neighborhood:"Excelsior", address:"35 Onondaga Ave, 94112", phone:"415-676-8945", hours:{open:9,close:14}, hoursLabel:"Saturdays + select evenings", langs:["Spanish","English","Cantonese","Tagalog"], insurance:["100% FREE — no insurance ever"], note:"Free primary care for uninsured working adults who don't qualify for government programs.", url:"https://www.clinicbythebay.org" },
    { name:"St. Anthony's Medical Clinic", neighborhood:"Tenderloin", address:"150 Golden Gate Ave, 94102", phone:"415-241-2600", hours:{open:8.5,close:16}, hoursLabel:"Mon–Fri 8:30am–4pm", langs:["Spanish","English"], insurance:["FREE — walk-in, no insurance needed"], note:"Free walk-in primary care. No appointment, no cost, no insurance check.", url:"https://www.stanthonysf.org/clinic" },
  ],
  mental: [
    { name:"Instituto Familiar de la Raza", neighborhood:"Mission", address:"2919 Mission St, 94110", phone:"415-229-0500", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Spanish","English"], insurance:["Medi-Cal","Sliding scale"], note:"Bilingual Spanish/English mental health and wellness for Latino community.", url:"https://www.ifrsf.org" },
    { name:"Asian American Recovery Services", neighborhood:"Mission / Citywide", address:"1735 Mission St, 94103", phone:"415-896-0880", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Cantonese","Mandarin","Tagalog","Vietnamese","English"], insurance:["Medi-Cal","Sliding scale"], note:"Mental health and substance use for Asian Pacific Islander communities.", url:"https://www.aars-sf.org" },
    { name:"SF Crisis Line (24/7)", neighborhood:"Citywide", address:"Phone only", phone:"988 or 415-781-0500", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["English","Spanish","Cantonese","Mandarin"], insurance:["Free"], note:"Call 988 (national) or 415-781-0500 (SF). Multilingual available.", url:"https://www.sfsuicideprevention.org" },
  ],
  benefits: [
    { name:"SF Human Services Agency", neighborhood:"Mission / SoMa", address:"1235 Mission St, 94103", phone:"415-558-4700", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Spanish","Cantonese","Mandarin","English"], insurance:["Free enrollment help — Medi-Cal, Healthy SF, Covered CA, CalFresh"], note:"⚠️ Medi-Cal cuts active 2025-26. Come here to understand your options and re-enroll.", url:"https://www.sfhsa.org" },
    { name:"Covered California Helpline", neighborhood:"Statewide", address:"Phone / coveredca.gov", phone:"800-300-1506", hours:{open:8,close:18}, hoursLabel:"Mon–Fri 8am–6pm", langs:["English","Spanish","Cantonese","Mandarin","Korean","Vietnamese"], insurance:["Free help applying for insurance or Medi-Cal"], note:"If you lost Medi-Cal due to 2025-26 cuts, call to check Covered CA eligibility.", url:"https://www.coveredca.gov" },
  ],
  phone: [
    { name:"211 SF — Any Health or Social Need", neighborhood:"Citywide", address:"Phone / 211sf.org", phone:"Dial 211", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["150+ languages"], insurance:["Free"], note:"Not sure where to go? Call 211. They know every resource in the city.", url:"https://www.211sf.org" },
  ],
};

const PROGRAMS = {
  medicaid:    { name:"Medi-Cal", who:"Low-income CA residents. New undocumented adult enrollment frozen Jan 2026.", how:"benefitscal.com or call 415-558-4700", color:"#2E7D32", alert:"⚠️ Enrollment frozen for new undocumented adults Jan 2026. If enrolled before, you keep coverage." },
  healthySF:   { name:"Healthy SF", who:"SF residents 19+, uninsured, income <~$40k/yr. ANY immigration status.", how:"Enroll at any DPH clinic or sfhsa.org", color:"#1565C0", alert:null },
  coveredCA:   { name:"Covered California", who:"Citizens and legal residents. Subsidies if income <$55k.", how:"coveredca.gov or 800-300-1506", color:"#6A1B9A", alert:"⚠️ Enhanced subsidies may expire 2026 — enroll now." },
  emergency:   { name:"Emergency Medi-Cal", who:"EVERYONE in California — no documentation, no income check for emergency care.", how:"Automatically applied at any ER in California", color:"#C62828", alert:null },
  children:    { name:"Medi-Cal for Children", who:"ALL children under 19 in California regardless of immigration status or income.", how:"benefitscal.com or any clinic — unchanged by 2025-26 cuts", color:"#00695C", alert:null },
  clinicByBay: { name:"Clinic by the Bay (Free Care)", who:"Uninsured working adults who don't qualify for any government program.", how:"clinicbythebay.org — walk in on Saturdays, Excelsior", color:"#E65100", alert:null },
};

function buildPrompt(insCtx) {
  return `You are a warm, multilingual healthcare navigator for San Francisco, California. You serve all SF neighborhoods.

RULES:
- Respond in the EXACT language the user writes in — auto-detect and match always.
- NEVER diagnose. Navigate and route only.
- Be warm, brief, human. Many users are scared, uninsured, or worried about immigration.
- SF is a Sanctuary City — mention this proactively if immigration fear is apparent.
- Route to the LOWEST appropriate care level.
- Medi-Cal cuts are active 2025-2026 — acknowledge and redirect proactively.
- After routing always give 1 brief "what to bring" practical tip.

INSURANCE CONTEXT: ${insCtx}

TRIAGE:
🚨 911: Chest pain, stroke signs, severe allergic reaction, unconscious, major bleeding, overdose, active suicidal crisis.
🏥 ER: ZSFG (1001 Potrero Ave — public, sanctuary city, no one turned away) or UCSF (505 Parnassus).
⚡ URGENT/PRIMARY by neighborhood:
- Mission → Mission Neighborhood Health Center, 240 Van Ness, 415-552-3870 (Spanish, sliding scale)
- Tenderloin → Tom Waddell 230 Golden Gate (walk-in, Arabic/Spanish) OR St. Anthony's FREE clinic 150 Golden Gate
- Chinatown → Chinatown PHC, 1490 Mason St (Cantonese/Mandarin)
- Bayview/Excelsior → Southeast Health Center, 2401 Keith St (Tagalog/Samoan)
- Richmond → RAMS, 3626 Balboa St (Cantonese/Mandarin/Russian)
- Potrero/SoMa → Potrero Hill Health Center, 1050 Wisconsin St
🏘️ FREE: Clinic by the Bay (35 Onondaga Ave, Saturdays), St. Anthony's (150 Golden Gate, Mon–Fri)
🧠 MENTAL: Instituto Familiar de la Raza (Mission, Spanish/English, 415-229-0500), AARS (Asian/PI, 415-896-0880), Crisis: 988
📋 BENEFITS: Healthy SF (any immigration status), Emergency Medi-Cal (everyone), Children's Medi-Cal (ALL kids <19). SF HSA: 415-558-4700.
📞 UNSURE: 211 (24/7, 150+ languages)

STYLE: Greeting → ask what's happening → max 2 follow-up questions → specific routing → practical tip → offer more help. Under 120 words per response.`;
}

async function callClaude(messages, insCtx) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error("VITE_OPENAI_API_KEY environment variable is not set. Vercel: add it to Project Settings > Environment Variables");
  const systemMsg = { role: "system", content: buildPrompt(insCtx) };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + apiKey },
    body: JSON.stringify({
      model:"gpt-4",
      max_tokens:1000,
      messages: [systemMsg, ...messages],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || "";
}

function isOpenNow(clinic) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes()/60;
  if (clinic.hours.open===0 && clinic.hours.close===24) return {open:true,label:"Open 24/7"};
  if (clinic.name.includes("Clinic by the Bay")) {
    if (day===6) return {open:hour>=9&&hour<14,label:"Open Saturdays 9am–2pm"};
    return {open:false,label:"Saturdays + select evenings only"};
  }
  if (day===0||day===6) return {open:false,label:"Closed weekends"};
  if (hour>=clinic.hours.open&&hour<clinic.hours.close) return {open:true,label:`Open now`};
  if (hour<clinic.hours.open) return {open:false,label:`Opens ${clinic.hours.open<13?clinic.hours.open+"am":(clinic.hours.open-12)+"pm"}`};
  return {open:false,label:"Closed for today"};
}

function detectUrgency(text) {
  const t = text.toLowerCase();
  if (t.includes("911")||t.includes("call 9")) return "emergency";
  if (t.includes("zsfg")||t.includes("ucsf")||t.includes("emergency department")) return "er";
  if (t.includes("mission neighborhood")||t.includes("walk-in")||t.includes("urgent")) return "urgent";
  if (t.includes("clinic by the bay")||t.includes("st. anthony")||t.includes("free clinic")) return "free";
  if (t.includes("mental")||t.includes("crisis")||t.includes("988")) return "mental";
  if (t.includes("medi-cal")||t.includes("healthy sf")||t.includes("covered ca")||t.includes("insurance")) return "benefits";
  return "default";
}

const U_STYLE = {
  emergency:{bg:"#FFF1F0",border:"#FF4D4F",icon:"🚨"},
  er:       {bg:"#FFF7E6",border:"#FA8C16",icon:"🏥"},
  urgent:   {bg:"#F0F5FF",border:"#2F54EB",icon:"⚡"},
  free:     {bg:"#F6FFED",border:"#52C41A",icon:"🏘️"},
  mental:   {bg:"#F9F0FF",border:"#722ED1",icon:"🧠"},
  benefits: {bg:"#E6FFFB",border:"#13C2C2",icon:"📋"},
  default:  {bg:"#FDFCFA",border:"#D4A853",icon:"💬"},
};

const QR = {
  en:["I have no insurance","I lost my Medi-Cal","Mental health support","My child needs care","I don't know where to go","Worried about immigration"],
  es:["No tengo seguro","Perdí mi Medi-Cal","Apoyo de salud mental","Mi hijo necesita atención","No sé adónde ir"],
  zh:["我没有保险","我失去了Medi-Cal","心理健康支持","我的孩子需要看病","我不知道去哪里"],
};

function ClinicCard({clinic, pinned, onPin}) {
  const s = isOpenNow(clinic);
  const [copied,setCopied] = useState(false);
  return (
    <div style={{padding:"11px 13px",borderRadius:"10px",marginBottom:"7px",border:"1.5px solid #EDE5DA",background:"#FDFCFA",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#C4622D";e.currentTarget.style.background="#FDF8F4";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#EDE5DA";e.currentTarget.style.background="#FDFCFA";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
        <div style={{flex:1,minWidth:0}}>
          <a href={clinic.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
            <div style={{fontWeight:600,color:"#2C1810",fontSize:"12px",lineHeight:1.3}}>{clinic.name}</div>
          </a>
          <div style={{fontSize:"10px",color:"#C4622D",fontWeight:500,marginTop:"1px"}}>📌 {clinic.neighborhood}</div>
        </div>
        <div style={{display:"flex",gap:"3px",marginLeft:"5px"}}>
          <button onClick={()=>{const t=`${clinic.name}\n${clinic.address}\n📞 ${clinic.phone}\n${clinic.url}`;navigator.clipboard?.writeText(t).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)});}} style={{background:"none",border:"1px solid #E8DDD4",borderRadius:"5px",padding:"2px 5px",fontSize:"10px",color:copied?"#52C41A":"#8B7355",cursor:"pointer"}}>{copied?"✓":"📋"}</button>
          <button onClick={()=>onPin(clinic.name)} style={{background:pinned?"#FDF0E8":"none",border:"1px solid #E8DDD4",borderRadius:"5px",padding:"2px 5px",fontSize:"10px",color:pinned?"#C4622D":"#8B7355",cursor:"pointer"}}>📌</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"4px"}}>
        <span style={{width:"6px",height:"6px",borderRadius:"50%",background:s.open?"#52C41A":"#FF4D4F",display:"inline-block"}}/>
        <span style={{fontSize:"10px",color:s.open?"#2E7D32":"#C62828",fontWeight:500}}>{s.label}</span>
      </div>
      <div style={{fontSize:"10px",color:"#6B5744",marginBottom:"2px"}}>📍 {clinic.address} · 📞 {clinic.phone}</div>
      <div style={{fontSize:"10px",color:"#8B7355",marginBottom:clinic.note?"3px":"0"}}>🗣️ {clinic.langs.join(" · ")}</div>
      {clinic.note&&<div style={{fontSize:"10px",color:"#C4622D",fontStyle:"italic",borderTop:"1px solid #EDE5DA",paddingTop:"4px",marginTop:"3px"}}>{clinic.note}</div>}
    </div>
  );
}

function ProgramCard({pKey}) {
  const p=PROGRAMS[pKey]; if(!p) return null;
  return (
    <div style={{padding:"11px 13px",borderRadius:"9px",marginBottom:"8px",background:"#FFFFFF",borderLeft:`4px solid ${p.color}`,border:`1.5px solid ${p.color}22`,borderLeftWidth:"4px"}}>
      <div style={{fontWeight:600,color:p.color,fontSize:"12px",marginBottom:"3px"}}>{p.name}</div>
      <div style={{fontSize:"11px",color:"#5C4B3A",lineHeight:1.5,marginBottom:"3px"}}>✓ {p.who}</div>
      <div style={{fontSize:"10px",color:"#8B7355"}}>How: {p.how}</div>
      {p.alert&&<div style={{fontSize:"10px",color:"#C62828",background:"#FFF1F0",padding:"4px 7px",borderRadius:"4px",marginTop:"6px"}}>{p.alert}</div>}
    </div>
  );
}

function Screener({lang,onComplete,onBack}) {
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState({});
  const Qs=[
    {id:"resident",en:"Do you currently live in San Francisco?",es:"¿Vive en San Francisco?",zh:"您住在旧金山吗？",opts:[{l:"Yes / Sí / 是",v:"yes"},{l:"No",v:"no"}]},
    {id:"status",en:"Your immigration status:",es:"Su situación migratoria:",zh:"您的移民身份：",opts:[{l:"US Citizen / Green Card",v:"citizen"},{l:"Visa / Work Permit / DACA",v:"visa"},{l:"Undocumented / Unsure",v:"undocumented"},{l:"Prefer not to say",v:"prefer_not"}]},
    {id:"income",en:"Approximate yearly household income:",es:"Ingreso familiar anual:",zh:"家庭年收入：",opts:[{l:"Under $20,000",v:"low"},{l:"$20k – $50k",v:"mid"},{l:"Over $50,000",v:"high"},{l:"Prefer not to say",v:"prefer_not"}]},
    {id:"children",en:"Children under 19 needing care?",es:"¿Hijos menores de 19 años?",zh:"有19岁以下的孩子吗？",opts:[{l:"Yes / Sí / 是",v:"yes"},{l:"No",v:"no"}]},
    {id:"coverage",en:"Do you currently have health insurance?",es:"¿Tiene seguro de salud?",zh:"您有医疗保险吗？",opts:[{l:"Yes, I'm covered",v:"yes"},{l:"No insurance",v:"none"},{l:"Lost Medi-Cal recently",v:"lost"},{l:"Not sure",v:"unsure"}]},
  ];
  const q=Qs[step];
  const qText=(lang==="es"||lang==="tl"||lang==="vi")?q.es:(lang==="zh"||lang==="yue")?q.zh:q.en;
  const handle=(val)=>{
    const next={...answers,[q.id]:val};
    setAnswers(next);
    if(step<Qs.length-1){setStep(s=>s+1);return;}
    const{resident,status,income,children,coverage}=next;
    const progs=[];
    if(children==="yes") progs.push("Medi-Cal for Children (ALL children under 19 qualify regardless of immigration status — mention prominently)");
    if(coverage==="none"||coverage==="unsure"||coverage==="lost"){
      if(resident==="yes"&&(status==="undocumented"||status==="prefer_not")){
        progs.push("Healthy SF (any immigration status, SF residents)");
        progs.push("Emergency Medi-Cal (everyone for emergency care)");
        progs.push("Clinic by the Bay (100% free)");
      }
      if(status==="citizen"||status==="visa"){
        if(income==="low"||income==="mid") progs.push("Medi-Cal (likely eligible)");
        progs.push("Covered California with subsidies");
      }
      if(coverage==="lost") progs.push("⚠️ Lost Medi-Cal — prioritize Healthy SF and Covered CA. Direct to SF HSA 415-558-4700");
    }
    if(resident==="no") progs.push("Emergency Medi-Cal (everyone in California for emergency care)");
    if(progs.length===0) progs.push("Covered California marketplace plans");
    const ctx=`SF resident:${resident}. Status:${status}. Income:${income}. Children<19:${children}. Coverage:${coverage}. Programs: ${progs.join("; ")}`;
    onComplete(ctx,next);
  };
  return (
    <div style={{maxWidth:"420px",margin:"0 auto",padding:"0 20px"}}>
      <button onClick={step===0?onBack:()=>setStep(s=>s-1)} style={{background:"none",border:"none",color:"#8B7355",cursor:"pointer",fontSize:"13px",padding:"0 0 16px 0"}}>← Back</button>
      <div style={{display:"flex",gap:"4px",marginBottom:"20px"}}>
        {Qs.map((_,i)=><div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:i<=step?"#C4622D":"#E8DDD4",transition:"background 0.3s"}}/>)}
      </div>
      <p style={{color:"#8B7355",fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.5px",margin:"0 0 8px 0"}}>{step+1} of {Qs.length}</p>
      <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"19px",color:"#2C1810",fontWeight:400,lineHeight:1.4,margin:"0 0 5px 0"}}>{qText}</h2>
      <p style={{color:"#8B7355",fontSize:"11px",margin:"0 0 16px 0"}}>All answers are private and anonymous.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
        {q.opts.map(o=>(
          <button key={o.v} onClick={()=>handle(o.v)} style={{padding:"12px 16px",background:"#FFFFFF",border:"1.5px solid #E8DDD4",borderRadius:"10px",textAlign:"left",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#2C1810",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#C4622D";e.currentTarget.style.background="#FDF8F4";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.background="#FFFFFF";}}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SFCareNavigator() {
  const [screen,setScreen]=useState("lang");
  const [lang,setLang]=useState(null);
  const [insCtx,setInsCtx]=useState("");
  const [insAnswers,setInsAnswers]=useState({});
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);
  const [panel,setPanel]=useState(null);
  const [pinned,setPinned]=useState([]);
  const [hood,setHood]=useState("All");
  const [fontSize,setFontSize]=useState(14);
  const [feedback,setFeedback]=useState({});
  const [showQR,setShowQR]=useState(true);
  const [detectedLang,setDetectedLang]=useState(null);
  const [showSummary,setShowSummary]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  useEffect(()=>{
    if(!input){setDetectedLang(null);return;}
    for(const{code,re}of LANG_PATTERNS){if(re.test(input)){setDetectedLang(code);return;}}
    setDetectedLang(null);
  },[input]);

  const togglePin=useCallback((name)=>{
    setPinned(p=>p.includes(name)?p.filter(n=>n!==name):[...p,name]);
  },[]);

  const startVoice=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice input requires Chrome browser.");return;}
    const r=new SR();
    r.lang=lang?.speechCode||"en-US";
    r.onresult=e=>{setInput(p=>p+e.results[0][0].transcript);setListening(false);};
    r.onerror=()=>setListening(false);
    r.onend=()=>setListening(false);
    r.start();setListening(true);
  };

  const startChat=async(ctx,answers)=>{
    setInsCtx(ctx);setInsAnswers(answers);setScreen("chat");setLoading(true);
    const greet=`Greet the user warmly in ${lang.label}. 1 sentence about safety/anonymity/sanctuary city. Ask what's going on. Max 3 sentences. Respond entirely in ${lang.label}.`;
    try{
      const text=await callClaude([{role:"user",content:greet}],ctx);
      setMessages([{role:"assistant",content:text,id:Date.now()}]);
    }catch(e){
      const errMsg=e.message||"";
      setMessages([{role:"assistant",content:`⚠️ Error: ${errMsg.slice(0,120)}`,id:Date.now()}]);
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg||loading)return;
    setInput("");setShowQR(false);
    const userMsg={role:"user",content:msg,id:Date.now()};
    const newMsgs=[...messages,userMsg];
    setMessages(newMsgs);
    setLoading(true);
    try{
      const reply=await callClaude(newMsgs.map(m=>({role:m.role,content:m.content})),insCtx);
      const aiMsg={role:"assistant",content:reply,id:Date.now()+1};
      setMessages(p=>[...p,aiMsg]);
      if(detectUrgency(reply)!=="default")setShowSummary(true);
    }catch(e){
      const errMsg=e.message||"";
      setMessages(p=>[...p,{role:"assistant",content:`⚠️ ${errMsg.slice(0,120)}`,id:Date.now()+1}]);
    }
    setLoading(false);setShowQR(true);
  };

  const reset=()=>{setScreen("lang");setLang(null);setMessages([]);setInput("");setInsCtx("");setInsAnswers({});setPanel(null);setShowSummary(false);setShowQR(true);};

  const getSummary=()=>[...messages].reverse().find(m=>m.role==="assistant"&&detectUrgency(m.content)!=="default")?.content||null;

  const inferredKeys=[];
  if(insAnswers.children==="yes")inferredKeys.push("children");
  if(insAnswers.status==="undocumented"||insAnswers.status==="prefer_not")inferredKeys.push("emergency","healthySF","clinicByBay");
  else if(insAnswers.status==="citizen"||insAnswers.status==="visa"){
    if(insAnswers.income==="low"||insAnswers.income==="mid")inferredKeys.push("medicaid","coveredCA");
    else inferredKeys.push("coveredCA");
  }
  if(insAnswers.coverage==="lost")inferredKeys.unshift("medicaid");
  const displayKeys=inferredKeys.length>0?inferredKeys:Object.keys(PROGRAMS);

  const hoods=["All",...new Set(Object.values(CLINICS).flat().map(c=>c.neighborhood))];
  const filteredClinics=Object.entries(CLINICS).reduce((acc,[cat,list])=>{
    const f=hood==="All"?list:list.filter(c=>c.neighborhood===hood);
    if(f.length)acc[cat]=f;return acc;
  },{});
  const CAT_LABELS={emergency:"🚨 Emergency",urgent:"⚡ Urgent / Primary Care",free:"🏘️ Free Clinics",mental:"🧠 Mental Health",benefits:"📋 Benefits & Insurance",phone:"📞 Phone / Remote"};
  const qreplies=QR[lang?.code]||QR.en;

  if(screen==="lang") return (
    <div style={{minHeight:"100vh",background:"#FAF7F2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"32px 20px",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"4px",background:"linear-gradient(90deg,#C4622D,#D4A853,#8B2500,#D4A853,#C4622D)",backgroundSize:"300% 100%",animation:"shimmer 4s linear infinite"}}/>
      <div style={{position:"absolute",top:"10px",left:"50%",transform:"translateX(-50%)",background:"#FFF1F0",border:"1px solid #FFCCC7",borderRadius:"8px",padding:"6px 14px",fontSize:"11px",color:"#C62828",display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap",zIndex:10}}>
        ⚠️ <strong>Medi-Cal cuts active 2025–26</strong> — we'll help you find alternatives
      </div>
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center",paddingTop:"36px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FDF0E8",border:"1px solid #E8C4A0",borderRadius:"100px",padding:"5px 16px",marginBottom:"22px"}}>
          <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#C4622D",display:"inline-block",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:"11px",color:"#C4622D",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:500}}>San Francisco · All Neighborhoods</span>
        </div>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(26px,5vw,42px)",color:"#2C1810",fontWeight:400,margin:"0 0 12px 0",lineHeight:1.15}}>Find the right care,<br/><em style={{color:"#C4622D"}}>right now.</em></h1>
        <p style={{color:"#6B5744",fontSize:"14px",lineHeight:1.6,margin:"0 0 6px 0"}}>Free to use. Completely anonymous. No insurance required.</p>
        <p style={{color:"#C4622D",fontSize:"12px",fontWeight:500,margin:"0 0 28px 0"}}>🏙️ SF Sanctuary City — safe for all immigration statuses</p>
        <p style={{color:"#8B7355",fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:"12px"}}>Choose your language / Elige tu idioma</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
          {LANGUAGES.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l);setScreen("privacy");}} style={{padding:"12px 16px",background:"#FFFFFF",border:"1.5px solid #E8DDD4",borderRadius:"10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#C4622D";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(196,98,45,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
              <span style={{fontSize:"18px"}}>{l.flag}</span>
              <span style={{fontSize:"13px",color:"#2C1810"}}>{l.label}</span>
            </button>
          ))}
        </div>
        <p style={{color:"#C4C0BB",fontSize:"11px"}}>Not a substitute for medical advice · Emergencies: call 911</p>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:0 0}100%{background-position:300% 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );

  if(screen==="privacy") return (
    <div style={{minHeight:"100vh",background:"#FAF7F2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"32px 20px"}}>
      <div style={{maxWidth:"400px",width:"100%"}}>
        <button onClick={()=>setScreen("lang")} style={{background:"none",border:"none",color:"#8B7355",cursor:"pointer",fontSize:"13px",padding:"0 0 16px 0"}}>← Back</button>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"22px",color:"#2C1810",fontWeight:400,margin:"0 0 20px 0"}}>Before we start</h2>
        {[
          {icon:"🔒",t:"Completely anonymous",b:"No name, address, or identifying info collected. Nothing stored after you close this."},
          {icon:"🏙️",t:"SF Sanctuary City",b:"Your info is never shared with immigration authorities. All clinics follow sanctuary city policy."},
          {icon:"⚠️",t:"Medi-Cal cuts are happening now",b:"California froze new Medi-Cal enrollment for undocumented adults Jan 2026. We'll help you find what you still qualify for."},
          {icon:"🏥",t:"No insurance? Options exist.",b:"Multiple clinics serve uninsured patients at zero cost. We'll find them for you."},
          {icon:"🩺",t:"Not medical advice",b:"This tool helps you find the right place to go — a real clinician sees you when you arrive."},
        ].map(i=>(
          <div key={i.t} style={{display:"flex",gap:"11px",marginBottom:"14px"}}>
            <span style={{fontSize:"17px",marginTop:"1px",flexShrink:0}}>{i.icon}</span>
            <div><div style={{fontWeight:500,color:"#2C1810",fontSize:"13px",marginBottom:"2px"}}>{i.t}</div><div style={{color:"#6B5744",fontSize:"12px",lineHeight:1.5}}>{i.b}</div></div>
          </div>
        ))}
        <button onClick={()=>setScreen("screener")} style={{width:"100%",padding:"13px",background:"#C4622D",border:"none",borderRadius:"10px",color:"#FFF",fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,marginTop:"6px",transition:"background 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="#A8521F"}
          onMouseLeave={e=>e.currentTarget.style.background="#C4622D"}>
          I understand — continue →
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  if(screen==="screener") return (
    <div style={{minHeight:"100vh",background:"#FAF7F2",display:"flex",flexDirection:"column",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"32px 0"}}>
      <Screener lang={lang?.code} onBack={()=>setScreen("privacy")} onComplete={startChat}/>
    </div>
  );

  return (
    <div style={{height:"100vh",background:"#FAF7F2",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif",fontSize:`${fontSize}px`}}>

      {/* HEADER */}
      <div style={{padding:"9px 12px",background:"rgba(250,247,242,0.97)",backdropFilter:"blur(10px)",borderBottom:"1px solid #EDE5DA",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#52C41A",display:"inline-block",animation:"pulse 2s infinite"}}/>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:"14px",color:"#2C1810"}}>SF Care Navigator</span>
          <span style={{fontSize:"10px",color:"#C4622D",background:"#FDF0E8",border:"1px solid #E8C4A0",padding:"1px 6px",borderRadius:"100px"}}>🏙️ Sanctuary City</span>
        </div>
        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
          <div style={{display:"flex",border:"1px solid #E8DDD4",borderRadius:"6px",overflow:"hidden"}}>
            <button onClick={()=>setFontSize(s=>Math.max(12,s-1))} style={{background:"none",border:"none",padding:"3px 6px",cursor:"pointer",color:"#8B7355",fontSize:"11px"}}>A-</button>
            <button onClick={()=>setFontSize(s=>Math.min(20,s+1))} style={{background:"none",border:"none",padding:"3px 6px",cursor:"pointer",color:"#8B7355",fontSize:"11px",borderLeft:"1px solid #E8DDD4"}}>A+</button>
          </div>
          {[{id:"alerts",label:"⚠️ Alerts"},{id:"clinics",label:"🏥 Clinics"},{id:"insurance",label:"📋 Programs"}].map(btn=>(
            <button key={btn.id} onClick={()=>setPanel(p=>p===btn.id?null:btn.id)} style={{background:panel===btn.id?"#FDF0E8":"none",border:"1px solid #E8DDD4",color:panel===btn.id?"#C4622D":"#6B5744",fontSize:"10px",padding:"3px 8px",borderRadius:"6px",cursor:"pointer",fontFamily:"inherit",fontWeight:panel===btn.id?500:400}}>{btn.label}</button>
          ))}
          <button onClick={reset} style={{background:"none",border:"1px solid #E8DDD4",color:"#8B7355",fontSize:"10px",padding:"3px 8px",borderRadius:"6px",cursor:"pointer"}}>↺</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"16px 12px",display:"flex",flexDirection:"column",gap:"11px"}}>

            {messages.map((msg,i)=>{
              const urgency=msg.role==="assistant"?detectUrgency(msg.content):"default";
              const us=U_STYLE[urgency];
              const fb=feedback[msg.id];
              return (
                <div key={msg.id||i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",animation:"fadeUp 0.22s ease"}}>
                  {msg.role==="assistant"&&(
                    <div style={{width:"24px",height:"24px",borderRadius:"50%",background:us.bg,border:`1.5px solid ${us.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",marginRight:"6px",flexShrink:0,marginTop:"2px"}}>{us.icon}</div>
                  )}
                  <div style={{maxWidth:"78%"}}>
                    <div style={{padding:"10px 14px",borderRadius:msg.role==="user"?"15px 15px 4px 15px":"4px 15px 15px 15px",background:msg.role==="user"?"#C4622D":"#FFFFFF",border:msg.role==="user"?"none":`1.5px solid ${us.border}22`,boxShadow:msg.role==="user"?"none":"0 1px 5px rgba(44,24,16,0.06)",color:msg.role==="user"?"#FFF":"#2C1810",lineHeight:1.65,whiteSpace:"pre-wrap",fontSize:"inherit"}}>
                      {msg.content}
                    </div>
                    {msg.role==="assistant"&&i>0&&(
                      <div style={{display:"flex",gap:"3px",marginTop:"3px",paddingLeft:"2px"}}>
                        <button onClick={()=>setFeedback(f=>({...f,[msg.id]:"up"}))} style={{background:fb==="up"?"#F6FFED":"none",border:"1px solid #E8DDD4",borderRadius:"5px",padding:"1px 6px",fontSize:"11px",cursor:"pointer",color:fb==="up"?"#52C41A":"#8B7355"}}>👍</button>
                        <button onClick={()=>setFeedback(f=>({...f,[msg.id]:"down"}))} style={{background:fb==="down"?"#FFF1F0":"none",border:"1px solid #E8DDD4",borderRadius:"5px",padding:"1px 6px",fontSize:"11px",cursor:"pointer",color:fb==="down"?"#FF4D4F":"#8B7355"}}>👎</button>
                        <button onClick={()=>navigator.clipboard?.writeText(msg.content)} style={{background:"none",border:"1px solid #E8DDD4",borderRadius:"5px",padding:"1px 6px",fontSize:"10px",cursor:"pointer",color:"#8B7355"}}>Copy</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading&&(
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#FFF",border:"1.5px solid #E8DDD4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>💬</div>
                <div style={{background:"#FFF",border:"1.5px solid #E8DDD4",borderRadius:"4px 15px 15px 15px",padding:"10px 14px",display:"flex",gap:"4px"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#C4622D",display:"inline-block",animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
                </div>
              </div>
            )}

            {showQR&&!loading&&messages.length>0&&messages.length<5&&(
              <div style={{paddingLeft:"30px"}}>
                <p style={{color:"#8B7355",fontSize:"10px",margin:"0 0 5px 0",textTransform:"uppercase",letterSpacing:"1px"}}>Common questions</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                  {qreplies.slice(0,4).map(qr=>(
                    <button key={qr} onClick={()=>send(qr)} style={{padding:"5px 11px",background:"#FFFFFF",border:"1.5px solid #E8DDD4",borderRadius:"100px",fontSize:"11px",color:"#2C1810",cursor:"pointer",transition:"all 0.15s",fontFamily:"'DM Sans',sans-serif"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#C4622D";e.currentTarget.style.color="#C4622D";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.color="#2C1810";}}>
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showSummary&&!loading&&getSummary()&&(
              <div style={{background:"#FFFBF5",border:"1.5px solid #D4A853",borderRadius:"10px",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"7px"}}>
                  <span style={{fontSize:"10px",fontWeight:600,color:"#8B5E00",textTransform:"uppercase",letterSpacing:"1px"}}>📄 Your Routing Summary</span>
                  <button onClick={()=>navigator.clipboard?.writeText(getSummary())} style={{background:"none",border:"1px solid #D4A853",borderRadius:"4px",padding:"2px 8px",fontSize:"10px",color:"#8B5E00",cursor:"pointer"}}>Copy</button>
                </div>
                <p style={{fontSize:"11px",color:"#5C3D00",lineHeight:1.6,margin:0}}>{getSummary()}</p>
              </div>
            )}

            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 12px",background:"#FFF1F0",border:"1px solid #FFCCC7",borderRadius:"8px",fontSize:"11px",color:"#C62828"}}>
              🚨 <strong>Life-threatening emergency?</strong> Call <strong>911</strong> immediately.
            </div>

            <div ref={bottomRef}/>
          </div>

          {/* INPUT */}
          <div style={{padding:"8px 12px 12px",borderTop:"1px solid #EDE5DA",background:"rgba(250,247,242,0.97)",flexShrink:0}}>
            {detectedLang&&detectedLang!==lang?.code&&(
              <div style={{fontSize:"10px",color:"#C4622D",marginBottom:"4px"}}>
                💬 Detected: {LANGUAGES.find(l=>l.code===detectedLang)?.label} — I'll respond in your language automatically
              </div>
            )}
            <div style={{display:"flex",gap:"6px",alignItems:"flex-end"}}>
              <button onClick={startVoice} style={{width:"40px",height:"40px",borderRadius:"50%",flexShrink:0,background:listening?"#C4622D":"#FFFFFF",border:`1.5px solid ${listening?"#C4622D":"#E8DDD4"}`,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>🎙️</button>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Describe what's going on... (Enter to send)"
                rows={1}
                style={{flex:1,background:"#FFFFFF",border:"1.5px solid #E8DDD4",borderRadius:"10px",padding:"9px 12px",color:"#2C1810",fontSize:"inherit",fontFamily:"'DM Sans',sans-serif",resize:"none",outline:"none",lineHeight:1.5,minHeight:"40px",maxHeight:"100px",overflowY:"auto"}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:"40px",height:"40px",borderRadius:"50%",flexShrink:0,background:input.trim()&&!loading?"#C4622D":"#EDE5DA",border:"none",cursor:input.trim()&&!loading?"pointer":"default",color:input.trim()&&!loading?"#FFF":"#A89880",fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>↑</button>
            </div>
            <p style={{color:"#C4C0BB",fontSize:"10px",textAlign:"center",marginTop:"6px"}}>Anonymous · Not medical advice · 911 for emergencies</p>
          </div>
        </div>

        {panel&&(
          <div style={{width:"270px",flexShrink:0,borderLeft:"1px solid #EDE5DA",background:"#FFFFFF",overflowY:"auto",animation:"slideIn 0.18s ease"}}>

            {panel==="alerts"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"15px",color:"#2C1810",margin:"0 0 3px 0",fontWeight:400}}>⚠️ Current Alerts</h3>
                <p style={{color:"#8B7355",fontSize:"10px",margin:"0 0 12px 0"}}>SF healthcare — March 2026</p>
                {[
                  {title:"Medi-Cal enrollment frozen",body:"New undocumented adult enrollment frozen Jan 2026. If enrolled before, coverage continues for now. Alternatives: Healthy SF, Clinic by the Bay.",color:"#C62828",url:"https://www.dhcs.ca.gov/services/medi-cal"},
                  {title:"Federal cuts ($1T+)",body:"HR1 passed 2025 cuts $1T+ from Medicaid. Up to 2M Californians may lose coverage. Call 415-558-4700.",color:"#C62828",url:"https://calbudgetcenter.org"},
                  {title:"Covered CA premiums rising",body:"Enhanced ACA subsidies may expire 2026. Check and enroll now at coveredca.gov.",color:"#E65100",url:"https://www.coveredca.gov"},
                  {title:"Children still fully covered",body:"All children under 19 in California qualify for Medi-Cal regardless of status. Unchanged by 2025-26 cuts.",color:"#2E7D32",url:"https://www.dhcs.ca.gov"},
                  {title:"Healthy SF still open",body:"City program — unaffected by federal cuts. Any immigration status, SF residents, income under ~$40k.",color:"#1565C0",url:"https://www.sfhsa.org"},
                ].map(a=>(
                  <a key={a.title} href={a.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",marginBottom:"8px"}}>
                    <div style={{padding:"10px 11px",borderLeft:`4px solid ${a.color}`,background:`${a.color}09`,borderRadius:"0 8px 8px 0",transition:"opacity 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      <div style={{fontWeight:600,color:a.color,fontSize:"11px",marginBottom:"3px"}}>{a.title}</div>
                      <div style={{fontSize:"10px",color:"#5C4B3A",lineHeight:1.5}}>{a.body}</div>
                      <div style={{fontSize:"10px",color:a.color,marginTop:"3px"}}>Source →</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {panel==="clinics"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"15px",color:"#2C1810",margin:"0 0 8px 0",fontWeight:400}}>🏥 SF Clinics</h3>
                <select value={hood} onChange={e=>setHood(e.target.value)} style={{width:"100%",padding:"6px 9px",border:"1.5px solid #E8DDD4",borderRadius:"6px",background:"#FDFCFA",fontSize:"11px",color:"#2C1810",marginBottom:"9px",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none"}}>
                  {hoods.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
                {pinned.length>0&&(
                  <div style={{marginBottom:"12px"}}>
                    <p style={{color:"#C4622D",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 6px 0"}}>📌 Pinned</p>
                    {Object.values(CLINICS).flat().filter(c=>pinned.includes(c.name)).map(c=><ClinicCard key={c.name} clinic={c} pinned={true} onPin={togglePin}/>)}
                  </div>
                )}
                {Object.entries(filteredClinics).map(([cat,clinics])=>(
                  <div key={cat} style={{marginBottom:"12px"}}>
                    <p style={{color:"#8B7355",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 6px 0"}}>{CAT_LABELS[cat]||cat}</p>
                    {clinics.map(c=><ClinicCard key={c.name} clinic={c} pinned={pinned.includes(c.name)} onPin={togglePin}/>)}
                  </div>
                ))}
              </div>
            )}

            {panel==="insurance"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"15px",color:"#2C1810",margin:"0 0 3px 0",fontWeight:400}}>📋 Programs</h3>
                <p style={{color:"#8B7355",fontSize:"11px",margin:"0 0 10px 0"}}>Based on your answers, you may qualify for:</p>
                {displayKeys.map(k=><ProgramCard key={k} pKey={k}/>)}
                <div style={{padding:"10px 12px",background:"#FDF8F4",border:"1px solid #E8C4A0",borderRadius:"8px",marginTop:"6px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"#C4622D",marginBottom:"3px"}}>Need help enrolling?</div>
                  <div style={{fontSize:"10px",color:"#6B5744",lineHeight:1.5}}>SF Human Services Agency — free, in your language.<br/><strong>📞 415-558-4700</strong><br/>1235 Mission St · Mon–Fri 8am–5pm<br/><a href="https://www.sfhsa.org" target="_blank" rel="noopener noreferrer" style={{color:"#C4622D"}}>sfhsa.org</a></div>
                </div>
                {insAnswers.coverage==="lost"&&(
                  <div style={{padding:"10px 12px",background:"#F0F5FF",border:"1px solid #91CAFF",borderRadius:"8px",marginTop:"6px"}}>
                    <div style={{fontSize:"11px",fontWeight:600,color:"#1565C0",marginBottom:"3px"}}>Lost Medi-Cal coverage?</div>
                    <div style={{fontSize:"10px",color:"#1565C0",lineHeight:1.5}}>Call 415-558-4700 immediately. You may qualify for Healthy SF at no cost.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:0 0}100%{background-position:300% 0}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#E8DDD4;border-radius:2px}
        textarea::placeholder{color:#B8A898}
      `}</style>
    </div>
  );
}