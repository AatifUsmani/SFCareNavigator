import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── FONTS (Noto Sans for full multilingual script support: Tamil, Bengali, Urdu, Hindi, Chinese)
(() => {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Noto+Sans:wght@300;400;500;600&family=Noto+Sans+Tamil:wght@400;600&display=swap";
  l.rel = "stylesheet";
  document.head.appendChild(l);
})();

// ── HAVERSINE DISTANCE (km between two lat/lng points) ─────────────────────
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── LANGUAGES ──────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code:"en",  label:"English",   flag:"🇺🇸", speechCode:"en-US" },
  { code:"es",  label:"Español",   flag:"🇲🇽", speechCode:"es-US" },
  { code:"zh",  label:"普通话",     flag:"🇨🇳", speechCode:"zh-CN" },
  { code:"yue", label:"廣東話",     flag:"🇭🇰", speechCode:"zh-HK" },
  { code:"tl",  label:"Tagalog",   flag:"🇵🇭", speechCode:"tl-PH" },
  { code:"vi",  label:"Tiếng Việt", flag:"🇻🇳", speechCode:"vi-VN" },
  { code:"ru",  label:"Русский",   flag:"🇷🇺", speechCode:"ru-RU" },
  { code:"ar",  label:"العربية",   flag:"🇸🇦", speechCode:"ar-SA" },
];

const LANG_PATTERNS = [
  { code:"es", re:/[áéíóúüñ¿¡]/i },
  { code:"zh", re:/[\u4e00-\u9fff]/ },
  { code:"ar", re:/[\u0600-\u06ff]/ },
  { code:"ru", re:/[\u0400-\u04ff]/ },
  { code:"vi", re:/[àáảãạăắặẳẵâấầậẩẫđèéẻẽẹêếềệểễìíỉĩịòóỏõọôốồộổỗơớờợởỡùúủũụưứừựửữỳýỷỹỵ]/i },
];

// ── SYMPTOM BUTTONS ────────────────────────────────────────────────────────
const SYMPTOM_BUTTONS = [
  { icon:"🤒", label:"Fever / Flu",        msg:"I have a fever and flu-like symptoms",           color:"#E8523A" },
  { icon:"🤕", label:"Pain / Injury",      msg:"I have pain or an injury",                       color:"#D4760A" },
  { icon:"😮‍💨", label:"Breathing",          msg:"I'm having trouble breathing",                   color:"#C62828" },
  { icon:"🤢", label:"Stomach / Nausea",   msg:"I have stomach pain or nausea",                  color:"#6B7A30" },
  { icon:"🧠", label:"Mental Health",      msg:"I need mental health support",                   color:"#6B3FA0" },
  { icon:"👶", label:"Child is Sick",      msg:"My child is sick and needs care",                color:"#1A6B5C" },
  { icon:"💊", label:"Prescription",       msg:"I need a prescription or medication refill",     color:"#1565A0" },
  { icon:"💳", label:"Can't Afford Care",  msg:"I'm not sure I can afford care or have Medi-Cal", color:"#2E5F3A" },
];

// ── CLINICS ───────────────────────────────────────────────────────────────────
const CLINICS = {
  emergency: [
    { name:"Zuckerberg SF General Hospital", neighborhood:"Potrero Hill", address:"1001 Potrero Ave, 94110", phone:"415-206-8000", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["All languages via interpreter"], insurance:["All welcome — no one turned away"], note:"SF's only public hospital. Sanctuary city — safe for all immigration statuses. No one turned away. Financial assistance automatic for uninsured.", url:"https://zuckerbergsanfranciscogeneral.org", lat:37.7556, lng:-122.4064 },
    { name:"UCSF Medical Center ER", neighborhood:"Inner Sunset", address:"505 Parnassus Ave, 94143", phone:"415-476-1037", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["Interpreters available"], insurance:["Most insurance","Financial assistance available"], note:"Ask admissions about the financial assistance program for uninsured patients.", url:"https://www.ucsfhealth.org", lat:37.7631, lng:-122.4588 },
  ],
  urgent: [
    { name:"Mission Neighborhood Health Center", neighborhood:"Mission", address:"240 Van Ness Ave, 94102", phone:"415-552-3870", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Spanish","English"], insurance:["Medi-Cal","Healthy SF","Sliding scale","Uninsured welcome"], note:"Bilingual Spanish/English. Sliding scale fees — pay what you can. Primary pilot partner.", url:"https://www.mnhc.org", lat:37.7779, lng:-122.4194 },
    { name:"Tom Waddell Urban Health Clinic", neighborhood:"Tenderloin", address:"230 Golden Gate Ave, 94102", phone:"415-355-7400", hours:{open:8,close:16.5}, hoursLabel:"Mon–Fri 8am–4:30pm", langs:["Spanish","Arabic","English","Interpreters"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Walk-in available. Arabic-speaking staff. Serves unhoused and uninsured residents.", url:"https://www.sf.gov/departments--department-public-health", lat:37.7813, lng:-122.4147 },
    { name:"Chinatown Public Health Center", neighborhood:"Chinatown", address:"1490 Mason St, 94133", phone:"415-364-7900", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Cantonese","Mandarin","English"], insurance:["Medi-Cal","Healthy SF","Sliding scale"], note:"Cantonese and Mandarin-speaking staff. Primary care hub for Chinatown.", url:"https://www.sf.gov/departments--department-public-health", lat:37.7942, lng:-122.4114 },
    { name:"Southeast Health Center", neighborhood:"Bayview / Excelsior", address:"2401 Keith St, 94124", phone:"415-671-7000", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Tagalog","Samoan","Spanish","English"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Tagalog and Samoan-speaking staff. Serves Bayview-Hunters Point and Excelsior.", url:"https://www.sf.gov/departments--department-public-health", lat:37.7267, lng:-122.3894 },
    { name:"RAMS — Richmond Area Multi-Services", neighborhood:"Richmond", address:"3626 Balboa St, 94121", phone:"415-668-5955", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Cantonese","Mandarin","Russian","English"], insurance:["Medi-Cal","Sliding scale"], note:"Serves Richmond's large Chinese and Russian-speaking communities.", url:"https://www.ramsinc.org", lat:37.7758, lng:-122.4969 },
    { name:"Potrero Hill Health Center", neighborhood:"Potrero Hill / SoMa", address:"1050 Wisconsin St, 94107", phone:"415-826-8400", hours:{open:8,close:17}, hoursLabel:"Mon–Fri 8am–5pm", langs:["Spanish","English","Interpreters"], insurance:["Medi-Cal","Healthy SF","Sliding scale"], note:"DPH primary care close to ZSFG.", url:"https://www.sf.gov/departments--department-public-health", lat:37.7536, lng:-122.3944 },
    { name:"North of Market Health Center", neighborhood:"Tenderloin / Nob Hill", address:"295 Turk St, 94102", phone:"415-474-7310", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["English","Spanish","Arabic","Vietnamese"], insurance:["Medi-Cal","Healthy SF","Uninsured welcome"], note:"Highly diverse Tenderloin area. Middle Eastern and SE Asian populations.", url:"https://www.sfccc.org", lat:37.7825, lng:-122.4147 },
  ],
  chc: [
    { name:"Clinic by the Bay", neighborhood:"Excelsior", address:"35 Onondaga Ave, 94112", phone:"415-676-8945", hours:{open:9,close:14}, hoursLabel:"Saturdays + select evenings", langs:["Spanish","English","Cantonese","Tagalog"], insurance:["100% FREE — no insurance ever"], note:"Free primary care for uninsured working adults who don't qualify for government programs.", url:"https://www.clinicbythebay.org", lat:37.7200, lng:-122.4394 },
    { name:"St. Anthony's Medical Clinic", neighborhood:"Tenderloin", address:"150 Golden Gate Ave, 94102", phone:"415-241-2600", hours:{open:8.5,close:16}, hoursLabel:"Mon–Fri 8:30am–4pm", langs:["Spanish","English"], insurance:["FREE — walk-in, no insurance needed"], note:"Free walk-in primary care. No appointment, no cost, no insurance check.", url:"https://www.stanthonysf.org/clinic", lat:37.7819, lng:-122.4142 },
  ],
  mental: [
    { name:"Instituto Familiar de la Raza", neighborhood:"Mission", address:"2919 Mission St, 94110", phone:"415-229-0500", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Spanish","English"], insurance:["Medi-Cal","Sliding scale"], note:"Bilingual Spanish/English mental health and wellness for Latino community.", url:"https://www.ifrsf.org", lat:37.7494, lng:-122.4181 },
    { name:"Asian American Recovery Services", neighborhood:"Mission / Citywide", address:"1735 Mission St, 94103", phone:"415-896-0880", hours:{open:9,close:17}, hoursLabel:"Mon–Fri 9am–5pm", langs:["Cantonese","Mandarin","Tagalog","Vietnamese","English"], insurance:["Medi-Cal","Sliding scale"], note:"Mental health and substance use for Asian Pacific Islander communities.", url:"https://www.aars-sf.org", lat:37.7694, lng:-122.4194 },
    { name:"SF Crisis Line (24/7)", neighborhood:"Citywide", address:"Phone only", phone:"988 or 415-781-0500", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["English","Spanish","Cantonese","Mandarin"], insurance:["Free"], note:"Call 988 (national) or 415-781-0500 (SF). Multilingual available.", url:"https://www.sfsuicideprevention.org", lat:37.7749, lng:-122.4194 },
  ],
  programs: [
    { name:"211 SF — Any Health or Social Need", neighborhood:"Citywide", address:"Phone / 211sf.org", phone:"Dial 211", hours:{open:0,close:24}, hoursLabel:"24/7", langs:["150+ languages"], insurance:["Free"], note:"Not sure where to go? Call 211. They know every resource in the city.", url:"https://www.211sf.org", lat:37.7749, lng:-122.4194 },
  ],
};

// ── PROGRAMS ────────────────────────────────────────────────
const ONT_PROGRAMS = {
  medicaid:    { name:"Medi-Cal", who:"Low-income CA residents. New undocumented adult enrollment frozen Jan 2026.", how:"benefitscal.com or call 415-558-4700", color:"#2E7D32", alert:"⚠️ Enrollment frozen for new undocumented adults Jan 2026. If enrolled before, you keep coverage." },
  healthySF:   { name:"Healthy SF", who:"SF residents 19+, uninsured, income <~$40k/yr. ANY immigration status.", how:"Enroll at any DPH clinic or sfhsa.org", color:"#1565C0", alert:null },
  coveredCA:   { name:"Covered California", who:"Citizens and legal residents. Subsidies if income <$55k.", how:"coveredca.gov or 800-300-1506", color:"#6A1B9A", alert:"⚠️ Enhanced subsidies may expire 2026 — enroll now." },
  emergency:   { name:"Emergency Medi-Cal", who:"EVERYONE in California — no documentation, no income check for emergency care.", how:"Automatically applied at any ER in California", color:"#C62828", alert:null },
  children:    { name:"Medi-Cal for Children", who:"ALL children under 19 in California regardless of immigration status or income.", how:"benefitscal.com or any clinic — unchanged by 2025-26 cuts", color:"#00695C", alert:null },
  clinicByBay: { name:"Clinic by the Bay (Free Care)", who:"Uninsured working adults who don't qualify for any government program.", how:"clinicbythebay.org — walk in on Saturdays, Excelsior", color:"#E65100", alert:null },
};

// ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
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

// ── DEMO RESPONSES ─────────────────────────────────────────────────────────
const DEMO = {
  greeting: {
    en: "Hi there! Welcome to the SF Care Navigator. This is a safe, confidential space — your information is never stored or shared. I'm here to help you find the right care in San Francisco. What's going on today?",
    zh: "您好！欢迎来到SF医疗导航。这是一个安全、保密的空间——您的信息不会被存储或共享。我在这里帮助您在旧金山找到合适的医疗服务。今天有什么情况？",
    ta: "வணக்கம்! SF கவலை வழிகாட்டிக்கு வரவேற்கிறோம். இது ஒரு பாதுகாப்பான, இரகசியமான இடம் — உங்கள் தகவல் சேமிக்கப்படாது அல்லது பகிரப்படாது. நான் ஸ்கார்போரோவில் சரியான சிகிச்சையை கண்டுபிடிக்க உதவுவதற்கு இங்கே இருக்கிறேன். இன்று என்ன நடக்கிறது?",
    tl: "Kamusta! Maligayang pagdating sa SF Care Navigator. Ito ay isang ligtas at kumpidensyal na espasyo — ang iyong impormasyon ay hindi kailanman iniimbak o ibinabahagi. Narito ako upang tulungan kang mahanap ang tamang pangangalaga sa San Francisco. Ano ang nangyayari ngayon?",
  },
  fever: "It sounds like you might be dealing with a flu or viral infection. For something like that, a walk-in clinic is your best bet — you don't need an appointment.\n\n**Mission Neighborhood Health Center** at 240 Van Ness Ave is a great option, especially if English isn't your first language — they have Spanish-speaking staff and sliding scale fees.\n\n**Tom Waddell Urban Health Clinic** at 230 Golden Gate Ave is open daily and serves the Tenderloin area.\n\n🟢 What to bring: Your Medi-Cal card if you have one. If you don't, tell the front desk — walk-ins can still help you. No appointment needed, just show up.\n\nIs there anything else I can help you with?",
  noOhip: "No Medi-Cal — that's okay, you still have really solid options in San Francisco.\n\n**St. Anthony's Medical Clinic** at 150 Golden Gate Ave (📞 415-241-2600) is completely FREE for primary care. No insurance check, no cost, walk-in only.\n\n**Clinic by the Bay** at 35 Onondaga Ave (📞 415-676-8945) is also 100% free for uninsured working adults. Open Saturdays.\n\n🟢 What to say when you arrive: \"I don't have Medi-Cal yet.\" They'll take it from there — you won't be turned away.\n\nIs there anything else I can help with?",
  mental: "Thank you for reaching out — that takes courage.\n\nFor mental health support in San Francisco:\n\n🧠 **Instituto Familiar de la Raza** at 2919 Mission St (415-229-0500) — bilingual Spanish/English mental health for the Latino community.\n\n🧠 **Asian American Recovery Services** at 1735 Mission St (415-896-0880) — serves Asian Pacific Islander communities.\n\n🚨 **If you need support right now:** Call **988** (free, 24/7). You don't need to be in crisis — they're there for anyone who's struggling.\n\nWhat's been going on for you? I can help narrow down the best option.",
  child: "For a sick child, **211 SF** is a great first step — it's a free information line, available 24/7, with interpreters in over 150 languages. A specialist will tell you whether your child needs to be seen urgently.\n\nIf they need to be seen in person:\n\n👶 **Southeast Health Center** at 2401 Keith St — serves Bayview and Excelsior with Tagalog and Samoan staff.\n\n👶 **Chinatown Public Health Center** at 1490 Mason St — Cantonese and Mandarin for Chinatown families.\n\n🟢 **Important:** Medi-Cal for Children covers ALL kids under 19 regardless of immigration status or income.\n\nHow old is your child and what's going on?",
  default: "I'm here to help you find the right care in San Francisco. Could you tell me a bit more — what symptoms or concerns are you dealing with, and roughly which part of San Francisco you're in? That'll help me point you to the most convenient option.",
};

function getDemoResponse(input, langCode, msgCount) {
  if (msgCount === 0) return DEMO.greeting[langCode] || DEMO.greeting.en;
  const t = (input||"").toLowerCase();
  if (t.includes("fever")||t.includes("flu")||t.includes("sick")||t.includes("cold")||t.includes("cough")) return DEMO.fever;
  if (t.includes("medi-cal")||t.includes("insurance")||t.includes("afford")||t.includes("can't pay")||t.includes("no insurance")) return DEMO.noOhip;
  if (t.includes("mental")||t.includes("anxiety")||t.includes("depress")||t.includes("sad")||t.includes("stress")) return DEMO.mental;
  if (t.includes("child")||t.includes("kid")||t.includes("baby")||t.includes("son")||t.includes("daughter")) return DEMO.child;
  return DEMO.default;
}

function isRateLimit(e) {
  return e && (e.includes("exceeded_limit")||e.includes("rate_limit")||e.includes("529")||e.includes("overload")||e.includes("5h"));
}

// ── API ────────────────────────────────────────────────────────────────────
async function callClaude(messages, insCtx) {
  // support either VITE_ prefix or plain key in case the environment
  // variable was misnamed in Vercel settings.  Return a message instead
  // of throwing so the app still deploys if the key is missing.
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not configured; returning warning text.");
    return "⚠️ OpenAI API key not found. Set VITE_OPENAI_API_KEY in your Vercel environment variables.";
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json",
        "Authorization": `Bearer ${apiKey}`
    },
    body:JSON.stringify({ model:"gpt-4o-mini", max_tokens:200, messages:[{role:"system", content:buildPrompt(insCtx)}, ...messages] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || "";
}

// ── OPEN/CLOSED STATUS ────────────────────────────────────────────────────
function openStatus(clinic) {
  const now = new Date(), day = now.getDay(), h = now.getHours()+now.getMinutes()/60;
  if (clinic.hours.open===0&&clinic.hours.close===24) return {open:true,label:"Open 24/7"};
  if (clinic.name.includes("Clinic by the Bay")) {
    if (day===6) return {open:h>=9&&h<14,label:"Open Saturdays 9am–2pm"};
    return {open:false,label:"Saturdays + select evenings only"};
  }
  if (day===0||day===6) return {open:false,label:"Closed weekends"};
  if (h>=clinic.hours.open&&h<clinic.hours.close) return {open:true,label:"Open now"};
  if (h<clinic.hours.open) { const o=clinic.hours.open; return {open:false,label:`Opens ${o<13?o+"am":(o-12)+"pm"}`}; }
  return {open:false,label:"Closed for today"};
}

// ── URGENCY DETECTION ─────────────────────────────────────────────────────
function detectUrgency(text) {
  const t = text.toLowerCase();
  if (t.includes("911")||t.includes("call 9")) return "emergency";
  if (t.includes("zsfg")||t.includes("ucsf")||t.includes("emergency department")) return "er";
  if (t.includes("urgent care")||t.includes("walk-in")||t.includes("mission neighborhood")||t.includes("tom waddell")) return "urgent";
  if (t.includes("clinic by the bay")||t.includes("st. anthony")||t.includes("free clinic")) return "chc";
  if (t.includes("mental")||t.includes("988")||t.includes("crisis")) return "mental";
  if (t.includes("medi-cal")||t.includes("healthy sf")||t.includes("covered ca")||t.includes("insurance")) return "programs";
  if (t.includes("211")) return "virtual";
  return "default";
}

const U_STYLE = {
  emergency:{bg:"#FFF1F0",border:"#FF4D4F",icon:"🚨"},
  er:       {bg:"#FFF7E6",border:"#FA8C16",icon:"🏥"},
  urgent:   {bg:"#F0F5FF",border:"#2F54EB",icon:"⚡"},
  chc:      {bg:"#F0FAF4",border:"#2E7D52",icon:"🏘️"},
  mental:   {bg:"#F9F0FF",border:"#722ED1",icon:"🧠"},
  programs: {bg:"#E6FFFB",border:"#13C2C2",icon:"📋"},
  virtual:  {bg:"#F6FFED",border:"#52C41A",icon:"📱"},
  default:  {bg:"#F5F8F5",border:"#A0C4AE",icon:"💬"},
};

// ── CLINIC CARD ────────────────────────────────────────────────────────────
function ClinicCard({clinic, pinned, onPin, distKmVal}) {
  const s = openStatus(clinic);
  const [copied,setCopied] = useState(false);
  return (
    <div style={{padding:"11px 13px",borderRadius:"10px",marginBottom:"7px",border:"1.5px solid #C8DDD0",background:"#FAFCFA",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#1A5C3A";e.currentTarget.style.background="#F0FAF4";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#C8DDD0";e.currentTarget.style.background="#FAFCFA";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
        <div style={{flex:1,minWidth:0}}>
          <a href={clinic.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
            <div style={{fontWeight:600,color:"#1A2E24",fontSize:"12px",lineHeight:1.3}}>{clinic.name}</div>
          </a>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"2px"}}>
            <span style={{fontSize:"10px",color:"#1A5C3A",fontWeight:500}}>📌 {clinic.neighborhood}</span>
            {distKmVal != null && <span style={{fontSize:"10px",background:"#E6F4EC",color:"#1A5C3A",padding:"1px 6px",borderRadius:"100px",fontWeight:500}}>📍 {distKmVal < 1 ? "<1 km" : distKmVal.toFixed(1)+" km"}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:"3px",marginLeft:"5px"}}>
          <button onClick={()=>{const t=`${clinic.name}\n${clinic.address}\n📞 ${clinic.phone}\n🕐 ${clinic.hoursLabel}`;navigator.clipboard?.writeText(t).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)});}} style={{background:"none",border:"1px solid #C8DDD0",borderRadius:"5px",padding:"2px 5px",fontSize:"10px",color:copied?"#2E7D52":"#6B8C78",cursor:"pointer"}}>{copied?"✓":"📋"}</button>
          <button onClick={()=>onPin(clinic.name)} style={{background:pinned?"#E6F4EC":"none",border:"1px solid #C8DDD0",borderRadius:"5px",padding:"2px 5px",fontSize:"10px",color:pinned?"#1A5C3A":"#6B8C78",cursor:"pointer"}}>📌</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"4px"}}>
        <span style={{width:"6px",height:"6px",borderRadius:"50%",background:s.open?"#52C41A":"#FF4D4F",display:"inline-block"}}/>
        <span style={{fontSize:"10px",color:s.open?"#2E7D52":"#C62828",fontWeight:500}}>{s.label} · {clinic.hoursLabel}</span>
      </div>
      <div style={{fontSize:"10px",color:"#4A6B56",marginBottom:"2px"}}>📍 {clinic.address}</div>
      <div style={{fontSize:"10px",color:"#4A6B56",marginBottom:"2px"}}>📞 {clinic.phone}</div>
      <div style={{fontSize:"10px",color:"#6B8C78",marginBottom:clinic.note?"3px":"0"}}>🗣️ {clinic.langs.join(" · ")}</div>
      {clinic.insurance&&<div style={{fontSize:"10px",color:"#4A6B56",marginBottom:clinic.note?"3px":"0"}}>💳 {clinic.insurance.join(" · ")}</div>}
      {clinic.note&&<div style={{fontSize:"10px",color:"#1A5C3A",fontStyle:"italic",borderTop:"1px solid #C8DDD0",paddingTop:"4px",marginTop:"3px"}}>{clinic.note}</div>}
    </div>
  );
}

// ── PROGRAM CARD ──────────────────────────────────────────────────────────
function ProgramCard({pKey}) {
  const p = ONT_PROGRAMS[pKey]; if(!p) return null;
  return (
    <div style={{padding:"11px 13px",borderRadius:"9px",marginBottom:"8px",background:"#FFFFFF",borderLeft:`4px solid ${p.color}`,border:`1.5px solid ${p.color}22`,borderLeftWidth:"4px"}}>
      <div style={{fontWeight:600,color:p.color,fontSize:"12px",marginBottom:"3px"}}>{p.name}</div>
      <div style={{fontSize:"11px",color:"#3A5C47",lineHeight:1.5,marginBottom:"3px"}}>✓ {p.who}</div>
      <div style={{fontSize:"10px",color:"#6B8C78"}}>How: {p.how}</div>
      {p.alert&&<div style={{fontSize:"10px",color:"#C62828",background:"#FFF1F0",padding:"4px 7px",borderRadius:"4px",marginTop:"6px"}}>{p.alert}</div>}
    </div>
  );
}

// ── SCREENER ──────────────────────────────────────────────────────────────
function Screener({lang, onComplete, onBack}) {
  const [step,setStep] = useState(0);
  const [answers,setAnswers] = useState({});
  const Qs = [
    { id:"resident", en:"Do you currently live in San Francisco?", es:"¿Vive en San Francisco?", zh:"您住在旧金山吗？", tl:"Nakatira ka ba sa San Francisco?",
      opts:[{l:"Yes / Sí / 是",v:"yes"},{l:"No",v:"no"}] },
    { id:"medicaid", en:"Do you currently have Medi-Cal health coverage?", es:"¿Tiene cobertura de Medi-Cal?", zh:"您目前有Medi-Cal健康保险吗？", tl:"Mayroon ka bang Medi-Cal?",
      opts:[{l:"Yes, I have Medi-Cal",v:"yes"},{l:"No Medi-Cal",v:"no"},{l:"My coverage might be expired",v:"expired"},{l:"Not sure",v:"unsure"}] },
    { id:"status", en:"Your immigration status:", es:"Su estatus migratorio:", zh:"您的移民身份：", tl:"Ang iyong katayuan sa imigrasyon:",
      opts:[{l:"U.S. citizen / PR",v:"citizen"},{l:"Work or study permit",v:"permit"},{l:"Undocumented / No status",v:"undocumented"},{l:"Other / Prefer not to say",v:"other"}] },
    { id:"age", en:"Your age group:", es:"Su grupo de edad:", zh:"您的年龄段：", tl:"Ang iyong grupo ng edad:",
      opts:[{l:"Under 19",v:"under19"},{l:"19–64",v:"adult"},{l:"65 or older",v:"senior"},{l:"Prefer not to say",v:"prefer_not"}] },
    { id:"coverage", en:"Are you looking for:", es:"Está buscando:", zh:"您正在寻找：", tl:"Hinahanap mo ba ang:",
      opts:[{l:"General medical care",v:"general"},{l:"Mental health support",v:"mental"},{l:"Prescription help",v:"prescription"},{l:"Help with costs / no coverage",v:"costs"}] },
  ];
  const q = Qs[step];
  const qText = lang==="zh"||lang==="yue" ? q.zh : lang==="es" ? q.es : lang==="tl" ? q.tl : q.en;
  const handle = (val) => {
    const next = {...answers,[q.id]:val};
    setAnswers(next);
    if (step < Qs.length-1) { setStep(s=>s+1); return; }
    const {resident,medicaid,status,age,coverage} = next;
    const progs = [];
    if (medicaid==="yes") progs.push("Has Medi-Cal — fully covered for medical care");
    if (medicaid==="no"||medicaid==="unsure") {
      if (status==="undocumented") progs.push("Emergency Medi-Cal — covers refugee claimants from day 1, bring IRCC certificate");
      else if (resident==="no") progs.push("No Medi-Cal yet — direct to SF HSA (415-558-4700) or any DPH clinic who serve all patients regardless of Medi-Cal status");
      else progs.push("May qualify for Medi-Cal — check benefitscal.com. In meantime SF HSA will see them.");
    }
    if (age==="under19") progs.push("Medi-Cal for Children — free for all kids under 19");
    if (age==="senior") progs.push("Medi-Cal for 65+ — enhanced coverage");
    if (coverage==="mental") progs.push("Mental health services available through DPH clinics and community orgs");
    if (coverage==="prescription") progs.push("Covered California or Healthy SF for prescription help");
    const ctx = `SF resident: ${resident}. Medi-Cal: ${medicaid}. Status: ${status}. Age: ${age}. Needs: ${coverage}. Programs: ${progs.join("; ")}. Always mention 211 as first step for symptom advice. SF is a sanctuary city — safe for all immigration statuses.`;
    onComplete(ctx, next);
  };
  return (
    <div style={{maxWidth:"420px",margin:"0 auto",padding:"0 20px"}}>
      <button onClick={step===0?onBack:()=>setStep(s=>s-1)} style={{background:"none",border:"none",color:"#6B8C78",cursor:"pointer",fontSize:"13px",padding:"0 0 16px 0"}}>← Back</button>
      <div style={{display:"flex",gap:"4px",marginBottom:"20px"}}>
        {Qs.map((_,i)=><div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:i<=step?"#1A5C3A":"#C8DDD0",transition:"background 0.3s"}}/>)}
      </div>
      <p style={{color:"#6B8C78",fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.5px",margin:"0 0 8px 0"}}>{step+1} of {Qs.length}</p>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"19px",color:"#1A2E24",fontWeight:400,lineHeight:1.4,margin:"0 0 5px 0"}}>{qText}</h2>
      <p style={{color:"#6B8C78",fontSize:"11px",margin:"0 0 16px 0"}}>All answers are private and anonymous.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
        {q.opts.map(o=>(
          <button key={o.v} onClick={()=>handle(o.v)} style={{padding:"12px 16px",background:"#FFFFFF",border:"1.5px solid #C8DDD0",borderRadius:"10px",textAlign:"left",cursor:"pointer",fontFamily:"'Noto Sans',sans-serif",fontSize:"13px",color:"#1A2E24",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#1A5C3A";e.currentTarget.style.background="#F0FAF4";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#C8DDD0";e.currentTarget.style.background="#FFFFFF";}}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function SFCareNavigator() {
  const [screen,setScreen] = useState("lang"); // lang | privacy | screener | chat
  const [lang,setLang] = useState(null);
  const [insCtx,setInsCtx] = useState("");
  const [insAnswers,setInsAnswers] = useState({});
  const [messages,setMessages] = useState([]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const [listening,setListening] = useState(false);
  const [panel,setPanel] = useState(null); // null | clinics | programs | alerts
  const [pinned,setPinned] = useState([]);
  const [catFilter,setCatFilter] = useState("all");
  const [fontSize,setFontSize] = useState(14);
  const [feedback,setFeedback] = useState({});
  const [showQR,setShowQR] = useState(true);
  const [showSymptoms,setShowSymptoms] = useState(true);
  const [demoMode,setDemoMode] = useState(false);
  const [showSummary,setShowSummary] = useState(false);
  const [userLocation,setUserLocation] = useState(null); // {lat, lng}
  const [locLoading,setLocLoading] = useState(false);
  const [locError,setLocError] = useState(null);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  const detectedLang = useMemo(() => {
    if (!input) return null;
    for (const {code, re} of LANG_PATTERNS) {
      if (re.test(input)) return code;
    }
    return null;
  }, [input]);

  const togglePin = useCallback((name)=>{
    setPinned(p=>p.includes(name)?p.filter(n=>n!==name):[...p,name]);
  },[]);

  // My Location
  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported in this browser."); return; }
    setLocLoading(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLocLoading(false); setPanel("clinics"); },
      () => { setLocError("Couldn't get your location. You can still browse clinics manually."); setLocLoading(false); }
    );
  };

  const getClinicDist = (clinic) => {
    if (!userLocation||!clinic.lat) return null;
    return distKm(userLocation.lat,userLocation.lng,clinic.lat,clinic.lng);
  };

  // Voice
  const startVoice = () => {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice input requires Chrome.");return;}
    const r = new SR(); r.lang=lang?.speechCode||"en-US";
    r.onresult=e=>{setInput(p=>p+e.results[0][0].transcript);setListening(false);};
    r.onerror=()=>setListening(false); r.onend=()=>setListening(false);
    r.start(); setListening(true);
  };

  const startChat = async (ctx, answers) => {
    setInsCtx(ctx); setInsAnswers(answers); setScreen("chat"); setLoading(true);
    const greet = `Greet the user warmly in ${lang.label}. 1 sentence: say this is safe and confidential. Ask what's going on. Max 2 sentences. Respond entirely in ${lang.label}.`;
    try {
      const text = await callClaude([{role:"user",content:greet}], ctx);
      setMessages([{role:"assistant",content:text,id:messageIdCounter}]);
      setMessageIdCounter(c => c + 1);
    } catch(e) {
      const msg = e.message||"";
      if(isRateLimit(msg)){
        setDemoMode(true);
        setMessages([{role:"assistant",content:DEMO.greeting[lang?.code]||DEMO.greeting.en,id:messageIdCounter,demo:true}]);
        setMessageIdCounter(c => c + 1);
      } else {
        setMessages([{role:"assistant",content:`⚠️ ${msg.slice(0,80)}`,id:messageIdCounter}]);
        setMessageIdCounter(c => c + 1);
      }
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const send = async (text) => {
    const msg = (text||input).trim(); if(!msg||loading) return;
    setInput(""); setShowQR(false); setShowSymptoms(false);
    const userMsg = {role:"user",content:msg,id:messageIdCounter};
    setMessageIdCounter(c => c + 1);
    const newMsgs = [...messages,userMsg];
    setMessages(newMsgs); setLoading(true);
    try {
      let reply;
      if(demoMode){ await new Promise(r=>setTimeout(r,800)); reply=getDemoResponse(msg,lang?.code,messages.length); }
      else { reply=await callClaude(newMsgs.map(m=>({role:m.role,content:m.content})),insCtx); }
      const aiMsg = {role:"assistant",content:reply,id:messageIdCounter,demo:demoMode};
      setMessageIdCounter(c => c + 1);
      setMessages(p=>[...p,aiMsg]);
      if(detectUrgency(reply)!=="default") setShowSummary(true);
    } catch(e) {
      const errMsg=e.message||"";
      if(isRateLimit(errMsg)&&!demoMode){
        setDemoMode(true);
        await new Promise(r=>setTimeout(r,600));
        const reply=getDemoResponse(msg,lang?.code,messages.length);
        setMessages(p=>[...p,{role:"assistant",content:reply,id:messageIdCounter,demo:true}]);
        setMessageIdCounter(c => c + 1);
      } else {
        setMessages(p=>[...p,{role:"assistant",content:`⚠️ ${errMsg.slice(0,80)}`,id:messageIdCounter}]);
        setMessageIdCounter(c => c + 1);
      }
    }
    setLoading(false); setShowQR(true);
  };

  const reset = () => { setScreen("lang");setLang(null);setMessages([]);setInput("");setInsCtx("");setInsAnswers({});setPanel(null);setShowSummary(false);setShowQR(true);setShowSymptoms(true);setDemoMode(false);setUserLocation(null); };
  const getSummary = () => [...messages].reverse().find(m=>m.role==="assistant"&&detectUrgency(m.content)!=="default")?.content||null;

  // Clinic filter and sort by distance
  const CAT_LABELS = {all:"All Clinics",emergency:"🚨 Emergency",urgent:"⚡ Urgent / Walk-in",chc:"🏘️ Community Health",mental:"🧠 Mental Health",programs:"📞 Phone & Programs"};
  const allClinics = Object.entries(CLINICS).flatMap(([cat,list])=>list.map(c=>({...c,cat})));
  const filteredClinics = (catFilter==="all" ? allClinics : allClinics.filter(c=>c.cat===catFilter))
    .map(c=>({...c,dist:getClinicDist(c)}))
    .sort((a,b)=>{
      if(a.dist!=null&&b.dist!=null) return a.dist-b.dist;
      if(a.dist!=null) return -1; if(b.dist!=null) return 1;
      return 0;
    });

  const inferredKeys = [];
  if(insAnswers.medicaid==="yes") inferredKeys.push("medicaid");
  if(insAnswers.status==="undocumented") inferredKeys.push("emergency","medicaid");
  if(insAnswers.medicaid==="no"||insAnswers.medicaid==="unsure") inferredKeys.push("healthySF","coveredCA","emergency");
  if(insAnswers.age==="under19") inferredKeys.push("children");
  if(insAnswers.coverage==="mental") inferredKeys.push("medicaid");
  if(insAnswers.coverage==="prescription") inferredKeys.push("coveredCA","healthySF");
  const displayKeys = [...new Set(inferredKeys.length>0?inferredKeys:Object.keys(ONT_PROGRAMS))];

  const QR_EN = ["I have no insurance","I lost my Medi-Cal","Mental health support","My child needs care","What's covered for newcomers?","Prescription help"];

  // ── LANG SCREEN ────────────────────────────────────────────────────────
  if(screen==="lang") return (
    <div style={{minHeight:"100vh",background:"#F2F6F3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans',sans-serif",padding:"32px 20px",position:"relative",overflow:"hidden"}}>
      {/* Top green stripe */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"5px",background:"linear-gradient(90deg,#1A5C3A,#2E7D52,#C8973A,#2E7D52,#1A5C3A)",backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite"}}/>
      {/* SHN badge */}
      <div style={{position:"absolute",top:"16px",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:"8px",whiteSpace:"nowrap"}}>
        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#2E7D52",animation:"pulse 2s infinite"}}/>
        <span style={{fontSize:"11px",color:"#2E7D52",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase"}}>San Francisco Health Network</span>
      </div>
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center",paddingTop:"32px"}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,5vw,42px)",color:"#1A2E24",fontWeight:400,margin:"0 0 14px 0",lineHeight:1.15}}>
          Not sure where to go<br/>for care in San Francisco?
        </h1>
        <p style={{color:"#4A6B56",fontSize:"14px",lineHeight:1.65,margin:"0 0 6px 0"}}>Tell us what's happening. We'll find the right place — fast.</p>
        <p style={{color:"#1A5C3A",fontSize:"12px",fontWeight:600,margin:"0 0 10px 0"}}>🇺🇸 Medi-Cal covered · Free for newcomers · Anonymous</p>
        {/* Telehealth banner */}
        <div style={{background:"#E6F4EC",border:"1px solid #A0C4AE",borderRadius:"10px",padding:"10px 16px",marginBottom:"28px",display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"20px"}}>📱</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:"12px",fontWeight:600,color:"#1A5C3A"}}>Not sure if you need to go in? Call 211 first.</div>
            <div style={{fontSize:"11px",color:"#4A6B56"}}>Free information line, 24/7, 150+ language interpreters. No Medi-Cal required.</div>
          </div>
        </div>
        <p style={{color:"#6B8C78",fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:"12px"}}>Choose your language</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
          {LANGUAGES.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l);setScreen("privacy");}} style={{padding:"12px 16px",background:"#FFFFFF",border:"1.5px solid #C8DDD0",borderRadius:"11px",cursor:"pointer",fontFamily:"'Noto Sans',sans-serif",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#1A5C3A";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(26,92,58,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#C8DDD0";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
              <span style={{fontSize:"18px"}}>{l.flag}</span>
              <span style={{fontSize:"13px",color:"#1A2E24"}}>{l.label}</span>
            </button>
          ))}
        </div>
        <p style={{color:"#A0C4AE",fontSize:"11px"}}>Not a substitute for medical advice · Emergencies: call 911</p>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:0 0}100%{background-position:200% 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );

  // ── PRIVACY SCREEN ──────────────────────────────────────────────────────
  if(screen==="privacy") return (
    <div style={{minHeight:"100vh",background:"#F2F6F3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans',sans-serif",padding:"32px 20px"}}>
      <div style={{maxWidth:"400px",width:"100%"}}>
        <button onClick={()=>setScreen("lang")} style={{background:"none",border:"none",color:"#6B8C78",cursor:"pointer",fontSize:"13px",padding:"0 0 16px 0"}}>← Back</button>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",color:"#1A2E24",fontWeight:400,margin:"0 0 20px 0"}}>Before we start</h2>
        {[
          {icon:"🔒",t:"Completely private",b:"No name, address, or identifying information is collected. Nothing is stored after you close this app."},
          {icon:"🆓",t:"Free to use — no Medi-Cal required",b:"You don't need Medi-Cal or any insurance to use this tool. It's free for everyone, including newcomers and undocumented residents."},
          {icon:"🌐",t:"We speak your language",b:"This tool works in 8 languages. When you arrive at a clinic, you can ask for a free interpreter — they're available at all SF clinics."},
          {icon:"🇺🇸",t:"San Francisco is a Sanctuary City",b:"SF protects immigrants. You cannot be asked about immigration status at healthcare facilities. You're safe here."},
          {icon:"🩺",t:"Not medical advice",b:"This tool helps you find the right place to go. A real doctor or nurse will assess you when you arrive."},
        ].map(i=>(
          <div key={i.t} style={{display:"flex",gap:"11px",marginBottom:"14px"}}>
            <span style={{fontSize:"17px",marginTop:"1px",flexShrink:0}}>{i.icon}</span>
            <div><div style={{fontWeight:500,color:"#1A2E24",fontSize:"13px",marginBottom:"2px"}}>{i.t}</div><div style={{color:"#4A6B56",fontSize:"12px",lineHeight:1.5}}>{i.b}</div></div>
          </div>
        ))}
        <button onClick={()=>setScreen("screener")} style={{width:"100%",padding:"13px",background:"#1A5C3A",border:"none",borderRadius:"10px",color:"#FFF",fontSize:"14px",cursor:"pointer",fontFamily:"'Noto Sans',sans-serif",fontWeight:500,marginTop:"6px",transition:"background 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="#144A2D"}
          onMouseLeave={e=>e.currentTarget.style.background="#1A5C3A"}>
          I understand — continue →
        </button>
      </div>
    </div>
  );

  // ── SCREENER ────────────────────────────────────────────────────────────
  if(screen==="screener") return (
    <div style={{minHeight:"100vh",background:"#F2F6F3",display:"flex",flexDirection:"column",justifyContent:"center",fontFamily:"'Noto Sans',sans-serif",padding:"32px 0"}}>
      <Screener lang={lang?.code} onBack={()=>setScreen("privacy")} onComplete={startChat}/>
    </div>
  );

  // ── CHAT SCREEN ─────────────────────────────────────────────────────────
  return (
    <div style={{height:"100vh",background:"#F2F6F3",display:"flex",flexDirection:"column",fontFamily:"'Noto Sans',sans-serif",fontSize:`${fontSize}px`}}>

      {/* DEMO BANNER */}
      {demoMode&&(
        <div style={{background:"#FFFBE6",borderBottom:"1px solid #FFD666",padding:"6px 14px",display:"flex",alignItems:"center",gap:"8px",fontSize:"11px",color:"#614700",flexShrink:0}}>
          🎭 <strong>Demo mode active</strong> — API rate limit reached. Showing scripted responses. In your Vite app with your own key, live AI takes over.
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"9px 12px",background:"rgba(242,246,243,0.97)",backdropFilter:"blur(10px)",borderBottom:"1px solid #C8DDD0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <span style={{width:"7px",height:"7px",borderRadius:"50%",background:demoMode?"#C8973A":"#2E7D52",display:"inline-block",animation:"pulse 2s infinite"}}/>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"14px",color:"#1A2E24"}}>SF Care Navigator</span>
          <span style={{fontSize:"10px",color:"#1A5C3A",background:"#E6F4EC",border:"1px solid #A0C4AE",padding:"1px 6px",borderRadius:"100px",fontWeight:500}}>San Francisco · All Neighborhoods</span>
          {demoMode&&<span style={{fontSize:"10px",color:"#8B5E00",background:"#FFFBE6",border:"1px solid #FFD666",padding:"1px 6px",borderRadius:"100px"}}>🎭 Demo</span>}
        </div>
        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
          {/* Location button */}
          <button onClick={requestLocation} disabled={locLoading} title="Find nearest clinic" style={{background:userLocation?"#E6F4EC":"none",border:`1px solid ${userLocation?"#A0C4AE":"#C8DDD0"}`,color:userLocation?"#1A5C3A":"#6B8C78",fontSize:"10px",padding:"3px 8px",borderRadius:"6px",cursor:"pointer",fontFamily:"inherit"}}>
            {locLoading?"⏳":"📍"} {userLocation?"Location set":"My location"}
          </button>
          <div style={{display:"flex",border:"1px solid #C8DDD0",borderRadius:"6px",overflow:"hidden"}}>
            <button onClick={()=>setFontSize(s=>Math.max(12,s-1))} style={{background:"none",border:"none",padding:"3px 6px",cursor:"pointer",color:"#6B8C78",fontSize:"11px"}}>A-</button>
            <button onClick={()=>setFontSize(s=>Math.min(20,s+1))} style={{background:"none",border:"none",padding:"3px 6px",cursor:"pointer",color:"#6B8C78",fontSize:"11px",borderLeft:"1px solid #C8DDD0"}}>A+</button>
          </div>
          {[{id:"alerts",label:"⚠️ Alerts"},{id:"clinics",label:"🏥 Clinics"},{id:"programs",label:"📋 Medi-Cal"}].map(btn=>(
            <button key={btn.id} onClick={()=>setPanel(p=>p===btn.id?null:btn.id)} style={{background:panel===btn.id?"#E6F4EC":"none",border:"1px solid #C8DDD0",color:panel===btn.id?"#1A5C3A":"#6B8C78",fontSize:"10px",padding:"3px 8px",borderRadius:"6px",cursor:"pointer",fontFamily:"inherit",fontWeight:panel===btn.id?600:400}}>{btn.label}</button>
          ))}
          <button onClick={reset} style={{background:"none",border:"1px solid #C8DDD0",color:"#6B8C78",fontSize:"10px",padding:"3px 8px",borderRadius:"6px",cursor:"pointer"}}>↺</button>
        </div>
      </div>

      {locError&&<div style={{background:"#FFF7E6",borderBottom:"1px solid #FFD591",padding:"5px 14px",fontSize:"11px",color:"#874D00",flexShrink:0}}>{locError}</div>}

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* MESSAGES */}
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
                    <div style={{padding:"10px 14px",borderRadius:msg.role==="user"?"15px 15px 4px 15px":"4px 15px 15px 15px",background:msg.role==="user"?"#1A5C3A":"#FFFFFF",border:msg.role==="user"?"none":`1.5px solid ${us.border}22`,boxShadow:msg.role==="user"?"none":"0 1px 5px rgba(26,46,36,0.07)",color:msg.role==="user"?"#FFF":"#1A2E24",lineHeight:1.65,whiteSpace:"pre-wrap",fontSize:"inherit"}}>
                      {msg.content}
                    </div>
                    {msg.role==="assistant"&&i>0&&(
                      <div style={{display:"flex",gap:"3px",marginTop:"3px"}}>
                        <button onClick={()=>setFeedback(f=>({...f,[msg.id]:"up"}))} style={{background:fb==="up"?"#F6FFED":"none",border:"1px solid #C8DDD0",borderRadius:"5px",padding:"1px 6px",fontSize:"11px",cursor:"pointer",color:fb==="up"?"#52C41A":"#6B8C78"}}>👍</button>
                        <button onClick={()=>setFeedback(f=>({...f,[msg.id]:"down"}))} style={{background:fb==="down"?"#FFF1F0":"none",border:"1px solid #C8DDD0",borderRadius:"5px",padding:"1px 6px",fontSize:"11px",cursor:"pointer",color:fb==="down"?"#FF4D4F":"#6B8C78"}}>👎</button>
                        <button onClick={()=>navigator.clipboard?.writeText(msg.content)} style={{background:"none",border:"1px solid #C8DDD0",borderRadius:"5px",padding:"1px 6px",fontSize:"10px",cursor:"pointer",color:"#6B8C78"}}>Copy</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading&&(
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#FFF",border:"1.5px solid #C8DDD0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>💬</div>
                <div style={{background:"#FFF",border:"1.5px solid #C8DDD0",borderRadius:"4px 15px 15px 15px",padding:"10px 14px",display:"flex",gap:"4px"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#1A5C3A",display:"inline-block",animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
                </div>
              </div>
            )}

            {/* SYMPTOM BUTTONS — shown early in conversation */}
            {showSymptoms&&!loading&&messages.length>0&&messages.length<3&&(
              <div style={{paddingLeft:"30px",animation:"fadeUp 0.3s ease"}}>
                <p style={{color:"#6B8C78",fontSize:"10px",margin:"0 0 8px 0",textTransform:"uppercase",letterSpacing:"1px"}}>What best describes your situation?</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                  {SYMPTOM_BUTTONS.map(btn=>(
                    <button key={btn.label} onClick={()=>send(btn.msg)} style={{padding:"10px 12px",background:"#FFFFFF",border:"1.5px solid #C8DDD0",borderRadius:"10px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Noto Sans',sans-serif",fontSize:"12px",color:"#1A2E24",textAlign:"left"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.color;e.currentTarget.style.background=`${btn.color}10`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#C8DDD0";e.currentTarget.style.background="#FFFFFF";}}>
                      <span style={{fontSize:"18px",flexShrink:0}}>{btn.icon}</span>
                      <span style={{fontWeight:500,lineHeight:1.2}}>{btn.label}</span>
                    </button>
                  ))}
                </div>
                <p style={{color:"#A0C4AE",fontSize:"10px",marginTop:"8px"}}>Or type your own message below ↓</p>
              </div>
            )}

            {/* Quick replies */}
            {showQR&&!loading&&messages.length>=3&&messages.length<7&&(
              <div style={{paddingLeft:"30px"}}>
                <p style={{color:"#6B8C78",fontSize:"10px",margin:"0 0 5px 0",textTransform:"uppercase",letterSpacing:"1px"}}>Common questions</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                  {QR_EN.slice(0,4).map(qr=>(
                    <button key={qr} onClick={()=>send(qr)} style={{padding:"5px 11px",background:"#FFFFFF",border:"1.5px solid #C8DDD0",borderRadius:"100px",fontSize:"11px",color:"#1A2E24",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Noto Sans',sans-serif"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#1A5C3A";e.currentTarget.style.color="#1A5C3A";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#C8DDD0";e.currentTarget.style.color="#1A2E24";}}>
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Routing summary */}
            {showSummary&&!loading&&getSummary()&&(
              <div style={{background:"#F0FAF4",border:"1.5px solid #A0C4AE",borderRadius:"10px",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"7px"}}>
                  <span style={{fontSize:"10px",fontWeight:600,color:"#1A5C3A",textTransform:"uppercase",letterSpacing:"1px"}}>📄 Your Care Recommendation</span>
                  <button onClick={()=>navigator.clipboard?.writeText(getSummary())} style={{background:"none",border:"1px solid #A0C4AE",borderRadius:"4px",padding:"2px 8px",fontSize:"10px",color:"#1A5C3A",cursor:"pointer"}}>Copy to share</button>
                </div>
                <p style={{fontSize:"11px",color:"#1A2E24",lineHeight:1.6,margin:0}}>{getSummary()}</p>
              </div>
            )}

            {/* 911 reminder */}
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 12px",background:"#FFF1F0",border:"1px solid #FFCCC7",borderRadius:"8px",fontSize:"11px",color:"#C62828",flexShrink:0}}>
              🚨 <strong>Life-threatening emergency?</strong> Call <strong>911</strong> immediately.
            </div>

            <div ref={bottomRef}/>
          </div>

          {/* INPUT */}
          <div style={{padding:"8px 12px 12px",borderTop:"1px solid #C8DDD0",background:"rgba(242,246,243,0.97)",flexShrink:0}}>
            {detectedLang&&detectedLang!==lang?.code&&(
              <div style={{fontSize:"10px",color:"#1A5C3A",marginBottom:"4px"}}>
                💬 Detected: {LANGUAGES.find(l=>l.code===detectedLang)?.label} — I'll respond in your language automatically
              </div>
            )}
            <div style={{display:"flex",gap:"6px",alignItems:"flex-end"}}>
              <button onClick={startVoice} style={{width:"40px",height:"40px",borderRadius:"50%",flexShrink:0,background:listening?"#1A5C3A":"#FFFFFF",border:`1.5px solid ${listening?"#1A5C3A":"#C8DDD0"}`,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>🎙️</button>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Describe what's going on... (Enter to send)"
                rows={1}
                style={{flex:1,background:"#FFFFFF",border:"1.5px solid #C8DDD0",borderRadius:"10px",padding:"9px 12px",color:"#1A2E24",fontSize:"inherit",fontFamily:"'Noto Sans',sans-serif",resize:"none",outline:"none",lineHeight:1.5,minHeight:"40px",maxHeight:"100px",overflowY:"auto"}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:"40px",height:"40px",borderRadius:"50%",flexShrink:0,background:input.trim()&&!loading?"#1A5C3A":"#C8DDD0",border:"none",cursor:input.trim()&&!loading?"pointer":"default",color:input.trim()&&!loading?"#FFF":"#6B8C78",fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>↑</button>
            </div>
            <p style={{color:"#A0C4AE",fontSize:"10px",textAlign:"center",marginTop:"6px"}}>Private & anonymous · Not medical advice · 911 for emergencies{demoMode?" · Demo mode":""}</p>
          </div>
        </div>

        {/* SIDE PANELS */}
        {panel&&(
          <div style={{width:"280px",flexShrink:0,borderLeft:"1px solid #C8DDD0",background:"#FFFFFF",overflowY:"auto",animation:"slideIn 0.18s ease"}}>

            {/* ALERTS PANEL */}
            {panel==="alerts"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",color:"#1A2E24",margin:"0 0 3px 0",fontWeight:400}}>⚠️ Current Alerts</h3>
                <p style={{color:"#6B8C78",fontSize:"10px",margin:"0 0 12px 0"}}>California healthcare · March 2026</p>
                {[
                  {title:"Medi-Cal enrollment freeze",body:"New undocumented adult enrollment frozen Jan 2026. If enrolled before, coverage continues for now. Alternatives: Healthy SF, Clinic by the Bay.",color:"#C62828",url:"https://www.sfhsa.org"},
                  {title:"Emergency Medi-Cal for everyone",body:"Anyone in California gets Emergency Medi-Cal at any ER — no documentation, no income check. Applied automatically when you arrive.",color:"#1A5C3A",url:"https://www.coveredca.gov"},
                  {title:"Healthy SF still open",body:"City program — unaffected by federal cuts. Any immigration status, SF residents, income <$40k.",color:"#2E7D52",url:"https://www.sfhsa.org"},
                  {title:"Covered CA premiums rising",body:"Enhanced ACA subsidies may expire 2026. Check and enroll now at coveredca.gov.",color:"#6B3FA0",url:"https://www.coveredca.gov"},
                  {title:"Children still fully covered",body:"All children under 19 in California qualify for Medi-Cal regardless of immigration status or income. Unchanged by 2025-26 cuts.",color:"#1A6B5C",url:"https://www.coveredca.gov"},
                  {title:"211 SF — free help line",body:"Call 211 for any health/social need. 24/7, 150+ languages. They know every resource in the city.",color:"#1565A0",url:"https://www.211sf.org"},
                ].map(a=>(
                  <a key={a.title} href={a.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",marginBottom:"8px"}}>
                    <div style={{padding:"10px 11px",borderLeft:`4px solid ${a.color}`,background:`${a.color}09`,borderRadius:"0 8px 8px 0",transition:"opacity 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      <div style={{fontWeight:600,color:a.color,fontSize:"11px",marginBottom:"3px"}}>{a.title}</div>
                      <div style={{fontSize:"10px",color:"#3A5C47",lineHeight:1.5}}>{a.body}</div>
                      <div style={{fontSize:"10px",color:a.color,marginTop:"3px"}}>Source →</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* CLINICS PANEL */}
            {panel==="clinics"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",color:"#1A2E24",margin:"0 0 3px 0",fontWeight:400}}>🏥 Clinics & Resources</h3>
                {userLocation
                  ? <p style={{color:"#1A5C3A",fontSize:"10px",margin:"0 0 8px 0",fontWeight:500}}>📍 Sorted by distance from your location</p>
                  : <button onClick={requestLocation} disabled={locLoading} style={{width:"100%",padding:"8px",background:"#E6F4EC",border:"1px solid #A0C4AE",borderRadius:"7px",fontSize:"11px",color:"#1A5C3A",cursor:"pointer",marginBottom:"8px",fontFamily:"inherit",fontWeight:500}}>
                      {locLoading?"⏳ Getting location...":"📍 Use my location — sort by distance"}
                    </button>
                }
                {/* Category filter */}
                <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"10px"}}>
                  {Object.entries(CAT_LABELS).map(([k,v])=>(
                    <button key={k} onClick={()=>setCatFilter(k)} style={{padding:"3px 8px",background:catFilter===k?"#1A5C3A":"none",border:`1px solid ${catFilter===k?"#1A5C3A":"#C8DDD0"}`,borderRadius:"100px",fontSize:"10px",color:catFilter===k?"#FFF":"#6B8C78",cursor:"pointer",transition:"all 0.15s"}}>
                      {v}
                    </button>
                  ))}
                </div>
                {/* Pinned */}
                {pinned.length>0&&(
                  <div style={{marginBottom:"12px"}}>
                    <p style={{color:"#1A5C3A",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 6px 0"}}>📌 Pinned</p>
                    {allClinics.filter(c=>pinned.includes(c.name)).map(c=><ClinicCard key={c.name} clinic={c} pinned={true} onPin={togglePin} distKmVal={getClinicDist(c)}/>)}
                  </div>
                )}
                {filteredClinics.map(c=>(
                  <div key={c.name}>
                    <ClinicCard clinic={c} pinned={pinned.includes(c.name)} onPin={togglePin} distKmVal={getClinicDist(c)}/>
                  </div>
                ))}
              </div>
            )}

            {/* PROGRAMS PANEL */}
            {panel==="programs"&&(
              <div style={{padding:"14px 12px"}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",color:"#1A2E24",margin:"0 0 3px 0",fontWeight:400}}>📋 California Programs</h3>
                <p style={{color:"#6B8C78",fontSize:"11px",margin:"0 0 10px 0"}}>Based on your answers, you may qualify for:</p>
                {displayKeys.map(k=><ProgramCard key={k} pKey={k}/>)}
                <div style={{padding:"10px 12px",background:"#E6F4EC",border:"1px solid #A0C4AE",borderRadius:"8px",marginTop:"6px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"#1A5C3A",marginBottom:"3px"}}>📱 Always call 211 first</div>
                  <div style={{fontSize:"10px",color:"#3A5C47",lineHeight:1.5}}>Free information line, 24/7, 150+ languages. Start here if unsure — they know every service in the city.</div>
                </div>
                <div style={{padding:"10px 12px",background:"#F5F8F5",border:"1px solid #C8DDD0",borderRadius:"8px",marginTop:"6px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"#1A2E24",marginBottom:"3px"}}>No Medi-Cal at all?</div>
                  <div style={{fontSize:"10px",color:"#3A5C47",lineHeight:1.5}}>Emergency Medi-Cal covers everyone at any ER. Healthy SF for SF residents. Clinic by the Bay for free care.</div>
                </div>
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
        @keyframes shimmer{0%{background-position:0 0}100%{background-position:200% 0}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#C8DDD0;border-radius:2px}
        textarea::placeholder{color:#A0C4AE}
      `}</style>
    </div>
  );
}