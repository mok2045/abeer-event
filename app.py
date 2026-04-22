# -*- coding: utf-8 -*-
# AI Poker — MVP (Final) — Streamlit
import os, json, time
import streamlit as st

st.set_page_config(page_title="AI Poker — MVP", layout="wide")
st.title("AI Poker — MVP (Final)")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL  = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

ROLES = {
    "Analyst": "أنت Analyst: حلّل الفكرة إلى نقاط قابلة للتنفيذ (5 نقاط مركزة). كن عمليًا ومباشرًا.",
    "Critic":  "أنت Critic: هاجم الافتراضات، أبرز المخاطر والثغرات والأسئلة المفتوحة (5 نقاط).",
    "Synth":   "أنت Synthesizer: ألّف خلاصة تنفيذية (5-9 نقاط)، ثم قرارًا نهائيًا وخطة سريعة، ثم مخاطر وتخفيف."
}

def call_openai(system_msg: str, user_msg: str, model: str = DEFAULT_MODEL, temperature: float = 0.6) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY غير مضبوط")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        r = client.chat.completions.create(
            model=model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg}
            ]
        )
        return r.choices[0].message.content
    except Exception as e:
        return f"[OpenAI Error] {e}"

def mock_answer(role: str, prompt: str) -> str:
    if role == "Analyst":
        bullets = [
            "تحويل المتطلبات إلى مهام صغيرة.",
            "تعريف معايير الجودة (AI-PQ).",
            "بناء تدفق الجولات (إجابة/نقد/تحكيم).",
            "ضبط التكلفة بنمذجة توكنات.",
            "خطة طرح تجريبية (Pilot)."
        ]
    elif role == "Critic":
        bullets = [
            "ترخيص وتمكين إعادة البيع.",
            "تكلفة الذروة وسعة التحمّل.",
            "سياسات الخصوصية والامتثال.",
            "اعتمادية النموذج الخارجي.",
            "تعقيد تجربة المستخدم."
        ]
    else:  # Synth
        return (
            "• خلاصة تنفيذية: MVP يُجري مناظرة بثلاث مراحل وينتج AI-PQ.\n"
            "• القرار: Pilot مغلق مع BYO-Key + تتبّع كلفة.\n"
            "• خطة: أسبوع1 إعداد، أسبوع2 اختبار، أسبوع3 طرح محدود.\n"
            "• المخاطر: ترخيص/كلفة/خصوصية — التخفيف عبر RAG Cache ونموذج خفيف للتصفية.\n"
            '{"ai_pq": 74}'
        )
    return f"[{role} | Mock]\n" + "\n".join(f"- {b}" for b in bullets)

st.sidebar.header("Settings")
use_mock = st.sidebar.checkbox("تشغيل بدون مفاتيح (Mock)", value=(OPENAI_API_KEY == ""))
model    = st.sidebar.selectbox("OpenAI model", ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"], index=0)
temperature = st.sidebar.slider("Temperature", 0.0, 1.0, 0.6, 0.1)

question = st.text_area("اكتب موضوع النقاش:", height=160,
                        placeholder="مثال: كيف نطلق AI Poker لوزارة كبيرة (1M مستخدم) مع ضبط التكلفة والامتثال؟")

c1, c2, c3 = st.columns(3)
btn_r1 = c1.button("الجولة 1 – إجابات الوكلاء")
btn_r2 = c2.button("الجولة 2 – النقد المتبادل")
btn_r3 = c3.button("التحكيم – خلاصة + AI-PQ")

for k, v in [("r1", {}), ("r2", {}), ("final", ""), ("pq", 0)]:
    if k not in st.session_state: st.session_state[k] = v

def answer(role: str, prompt: str) -> str:
    if use_mock:
        return mock_answer(role, prompt)
    return call_openai(ROLES[role], prompt, model=model, temperature=temperature)

if btn_r1:
    if not question.strip():
        st.warning("اكتب سؤالًا أولًا.")
    else:
        with st.spinner("تشغيل الجولة 1..."):
            st.session_state.r1 = {
                "Analyst": answer("Analyst", question),
                "Critic":  answer("Critic",  question)
            }
            st.session_state.r2, st.session_state.final, st.session_state.pq = {}, "", 0
        st.success("تمّت الجولة 1.")

if btn_r2:
    if not st.session_state.r1:
        st.warning("شغّل الجولة 1 أولًا.")
    else:
        joined = "\n\n".join([f"## {k}\n{v}" for k, v in st.session_state.r1.items()])
        critique_prompt = (
            "قيّم بدقة هذه المسودات:\n"
            f"{joined}\n\n"
            "أعطِ مخاطر وأسئلة مفتوحة ومواطن خلل بشكل نقاط مركزة."
        )
        with st.spinner("تشغيل الجولة 2..."):
            st.session_state.r2 = {"Critic": answer("Critic", critique_prompt)}
            st.session_state.final, st.session_state.pq = "", 0
        st.success("تمّت الجولة 2.")

if btn_r3:
    if not st.session_state.r1:
        st.warning("شغّل الجولة 1 أولًا.")
    else:
        bundle = json.dumps({"q": question, "r1": st.session_state.r1, "r2": st.session_state.r2},
                            ensure_ascii=False)[:18000]
        synth_prompt = (
            "لديك جولة1 (تحليل/نقد) وجولة2 (نقد متقدم). أعد:\n"
            "1) خلاصة تنفيذية (5–9 نقاط)\n"
            "2) قرار نهائي وخطة سريعة\n"
            "3) مخاطر وتخفيف\n"
            "ثم في السطر الأخير JSON: {\"ai_pq\": رقم 0-100}\n\n"
            f"المدخلات:\n{bundle}"
        )
        with st.spinner("تشغيل التحكيم..."):
            text = answer("Synth", synth_prompt)
            pq = 0
            try:
                last = text.strip().splitlines()[-1].strip()
                if last.startswith("{") and last.endswith("}"):
                    meta = json.loads(last)
                    pq = int(meta.get("ai_pq", 0))
                    text = "\n".join(text.strip().splitlines()[:-1])
            except Exception:
                pq = 0
            st.session_state.final = text
            st.session_state.pq    = max(0, min(100, pq))
        st.success("تمّ التحكيم.")

st.markdown("### الجولة 1 (إجابات)")
if st.session_state.r1:
    a, b = st.columns(2)
    with a: st.write("**Analyst**"); st.write(st.session_state.r1.get("Analyst",""))
    with b: st.write("**Critic**");  st.write(st.session_state.r1.get("Critic",""))
else:
    st.info("شغّل الجولة 1.")

st.markdown("### الجولة 2 (نقد)")
if st.session_state.r2:
    st.write(st.session_state.r2.get("Critic",""))
else:
    st.info("شغّل الجولة 2.")

st.markdown("### الخلاصة النهائية")
if st.session_state.final:
    st.write(st.session_state.final)
    st.markdown(f"**AI-PQ:** `{st.session_state.pq}` / 100")
else:
    st.info("شغّل التحكيم لإنتاج الخلاصة ودرجة الجودة.")

st.markdown("---")
fname = st.text_input("اسم ملف الحفظ (اختياري):", value="session.json")
if st.button("حفظ الجلسة"):
    data = {
        "question": question,
        "r1": st.session_state.r1,
        "r2": st.session_state.r2,
        "final": st.session_state.final,
        "ai_pq": st.session_state.pq,
        "ts": int(time.time())
    }
    with open(fname, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2))
    st.success(f"تم الحفظ: {fname}")
