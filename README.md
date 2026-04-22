# AI Poker — MVP (Final)

هذا هو **الـMVP النهائي** لعرض نموذج مناظرة مبسّط بين وكلاء ذكاء اصطناعي (Agents) عبر **Streamlit**.
يدعم وضع **Mock** (بدون مفاتيح) ويعمل فورًا، ويدعم **OpenAI** إذا ضُبط المفتاح.

## المتطلبات
- Python 3.9+
- حزم من `requirements.txt`

## التشغيل محليًا
```bash
pip install -r requirements.txt
# (اختياري) إذا لديك مفتاح OpenAI:
# macOS/Linux:
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"
# Windows (PowerShell):
# setx OPENAI_API_KEY "sk-..."
# setx OPENAI_MODEL "gpt-4o-mini"

streamlit run app.py
```

## النشر على Streamlit Cloud
1) اربط المستودع في GitHub.
2) ادخل https://share.streamlit.io وسجّل الدخول.
3) اختر المستودع والفرع وملف التشغيل `app.py`.
4) (اختياري) أضف **Secrets**:
```
OPENAI_API_KEY = "sk-..."
OPENAI_MODEL   = "gpt-4o-mini"
```
5) اضغط Deploy.

## الاستخدام
- اكتب موضوع النقاش في الحقل الرئيسي.
- استخدم الأزرار: **الجولة 1** (إجابات)، **الجولة 2** (نقد)، **التحكيم** (خلاصة + AI‑PQ).
- إن لم تضع مفتاح OpenAI سيعمل التطبيق في وضع **Mock** لإظهار الواجهة والسير الكامل.
- يمكنك حفظ الجلسة إلى ملف JSON من أسفل الصفحة.
