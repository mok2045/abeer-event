(function () {
  "use strict";
  let DATA = {settings:{},products:[]};
  let editingId = null;
  const $ = (id) => document.getElementById(id);
  document.addEventListener("DOMContentLoaded", () => { $("loginForm").addEventListener("submit",login); checkStatus(); bindDashboard(); });
  async function checkStatus(){try{const r=await fetch("api.php?action=status");const j=await r.json();if(j.admin)showDashboard();}catch{}}
  async function login(e){e.preventDefault();const password=$("loginPassword").value;try{const r=await fetch("api.php?action=login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});const j=await r.json();if(j.ok)showDashboard();else toast(j.error||"فشل الدخول",true);}catch{toast("تعذّر الاتصال بالخادم",true);}}
  async function logout(){try{await fetch("api.php?action=logout");}catch{}location.reload();}
  async function showDashboard(){$("loginScreen").style.display="none";$("dashboard").style.display="block";await loadData();renderProducts();fillSettings();}
  async function loadData(){try{const r=await fetch("api.php?action=data",{cache:"no-store"});DATA=await r.json();}catch{try{DATA=await(await fetch("data/data.json")).json();}catch{DATA={settings:{},products:[]};}}if(!Array.isArray(DATA.products))DATA.products=[];if(!DATA.settings)DATA.settings={};}
  async function saveAll(silent){try{const r=await fetch("api.php?action=save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(DATA)});const j=await r.json();if(j.ok){if(!silent)toast("✅ تم الحفظ والنشر");return true;}toast(j.error||"فشل الحفظ",true);return false;}catch{toast("تعذّر الاتصال بالخادم",true);return false;}}
  function bindDashboard(){
    $("saveAllBtn").addEventListener("click",()=>saveAll(false));
    $("logoutBtn").addEventListener("click",logout);
    document.querySelectorAll(".admin-tab").forEach(t=>t.addEventListener("click",()=>{document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");const v=t.dataset.view;$("productsView").style.display=v==="products"?"block":"none";$("settingsView").style.display=v==="settings"?"block":"none";}));
    $("addProductBtn").addEventListener("click",()=>openModal(null));
    $("searchInput").addEventListener("input",renderProducts);
    $("categoryFilter").addEventListener("change",renderProducts);
    $("saveProductBtn").addEventListener("click",saveProduct);
    $("cancelProductBtn").addEventListener("click",closeModal);
    $("pImage").addEventListener("input",()=>{$("imgPreview").src=$("pImage").value;});
    $("pImageFile").addEventListener("change",uploadImage);
    $("saveSettingsBtn").addEventListener("click",saveSettings);
    $("prodList").addEventListener("click",(e)=>{const edit=e.target.closest("[data-edit]");if(edit)return openModal(edit.dataset.edit);const del=e.target.closest("[data-del]");if(del)return deleteProduct(del.dataset.del);const tog=e.target.closest("[data-toggle]");if(tog)return toggleVisible(tog.dataset.toggle);});
  }
  const CAT_LABELS={bouquets:"باقات",vases:"فازات",special:"مناسبات"};
  const BADGE_LABELS={new:"جديد",bestseller:"الأكثر مبيعاً",sale:"عرض",exclusive:"حصري","":"—"};
  function renderProducts(){
    const q=($("searchInput").value||"").trim(),cat=$("categoryFilter").value;
    let list=DATA.products;
    if(cat!=="all")list=list.filter(p=>p.category===cat);
    if(q)list=list.filter(p=>(p.nameAr+" "+(p.nameEn||"")).includes(q));
    $("productCount").textContent=`${list.length} منتج`;
    $("prodList").innerHTML=list.map(p=>`<div class="prod-item"><img src="${p.image}" alt="${p.nameAr}" onerror="this.style.opacity=.3" /><div class="prod-info"><div class="name">${p.nameAr} ${p.visible===false?'<span class="hidden-badge">مخفي</span>':""}</div><div class="meta">${CAT_LABELS[p.category]||p.category} · ${BADGE_LABELS[p.badge]||"—"}</div><div class="price">${p.price} ر.س ${p.discountPct?`· خصم ${p.discountPct}%`:""}</div></div><div class="prod-actions"><button class="btn btn-ghost btn-sm" data-toggle="${p.id}">${p.visible===false?"إظهار":"إخفاء"}</button><button class="btn btn-gold btn-sm" data-edit="${p.id}">تعديل</button><button class="btn btn-danger btn-sm" data-del="${p.id}">حذف</button></div></div>`).join("")||`<p class="muted" style="text-align:center;padding:30px">لا توجد منتجات</p>`;
  }
  function openModal(id){editingId=id;const p=id?DATA.products.find(x=>x.id===id):null;$("modalTitle").textContent=p?"تعديل المنتج":"منتج جديد";$("pImage").value=p?.image||"";$("imgPreview").src=p?.image||"";$("pNameAr").value=p?.nameAr||"";$("pNameEn").value=p?.nameEn||"";$("pPrice").value=p?.price??"";$("pDiscount").value=p?.discountPct??0;$("pCategory").value=p?.category||"bouquets";$("pBadge").value=p?.badge||"";$("pVisible").checked=p?p.visible!==false:true;$("productModal").classList.add("open");}
  function closeModal(){$("productModal").classList.remove("open");editingId=null;$("pImageFile").value="";$("uploadStatus").textContent="";}
  async function uploadImage(){const f=$("pImageFile").files[0];if(!f)return;if(f.size>6*1024*1024){$("uploadStatus").textContent="⚠️ حجم الصورة كبير (الحد 6 ميجابايت)";return;}$("imgPreview").src=URL.createObjectURL(f);$("uploadStatus").textContent="⏳ جاري رفع الصورة...";const fd=new FormData();fd.append("image",f);try{const r=await fetch("api.php?action=upload",{method:"POST",body:fd});const j=await r.json();if(j.ok){$("pImage").value=j.url;$("imgPreview").src=j.url;$("uploadStatus").textContent="✅ تم رفع الصورة بنجاح";}else{$("uploadStatus").textContent="⚠️ "+(j.error||"فشل الرفع");}}catch{$("uploadStatus").textContent="⚠️ تعذّر الاتصال بالخادم";}}
  async function saveProduct(){const nameAr=$("pNameAr").value.trim(),price=Number($("pPrice").value);if(!nameAr){toast("اكتب اسم المنتج",true);return;}if(!(price>=0)){toast("اكتب سعراً صحيحاً",true);return;}const prod={nameAr,nameEn:$("pNameEn").value.trim(),price,discountPct:Number($("pDiscount").value)||0,category:$("pCategory").value,badge:$("pBadge").value,image:$("pImage").value.trim(),visible:$("pVisible").checked};if(editingId){const i=DATA.products.findIndex(x=>x.id===editingId);DATA.products[i]={...DATA.products[i],...prod};}else{prod.id="p"+Date.now();DATA.products.push(prod);}closeModal();renderProducts();await saveAll(true);toast("✅ تم الحفظ");}
  async function deleteProduct(id){if(!confirm("هل تريد حذف هذا المنتج؟"))return;DATA.products=DATA.products.filter(x=>x.id!==id);renderProducts();await saveAll(true);toast("تم الحذف");}
  async function toggleVisible(id){const p=DATA.products.find(x=>x.id===id);if(!p)return;p.visible=p.visible===false;renderProducts();await saveAll(true);}
  function fillSettings(){const s=DATA.settings||{};$("setStoreName").value=s.storeName||"";$("setTagline").value=s.tagline||"";$("setWhatsapp").value=s.whatsapp||"";$("setInstagram").value=s.instagram||"";$("setEmail").value=s.email||"";$("setAnnouncement").value=s.announcement||"";$("setGlobalDiscount").value=s.globalDiscount||0;$("setCurrency").value=s.currency||"ر.س";}
  async function saveSettings(){DATA.settings={...DATA.settings,storeName:$("setStoreName").value.trim(),tagline:$("setTagline").value.trim(),whatsapp:$("setWhatsapp").value.trim(),instagram:$("setInstagram").value.trim(),email:$("setEmail").value.trim(),announcement:$("setAnnouncement").value.trim(),globalDiscount:Number($("setGlobalDiscount").value)||0,currency:$("setCurrency").value.trim()||"ر.س"};await saveAll(false);}
  let toastTimer;
  function toast(text,err){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}t.className="toast"+(err?" err":"");t.textContent=text;requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200);}
})();
