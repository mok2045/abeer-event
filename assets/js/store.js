(function () {
  "use strict";
  const CART_KEY = "abeer_cart_v1";
  const CATEGORIES = [{key:"all",label:"الكل"},{key:"bouquets",label:"باقات"},{key:"vases",label:"فازات"},{key:"special",label:"مناسبات"}];
  const OCCASIONS = [{icon:"💝",label:"حبيبي"},{icon:"🌸",label:"أمي"},{icon:"🎂",label:"عيد ميلاد"},{icon:"🎓",label:"تخرج"},{icon:"💍",label:"زفاف"},{icon:"💐",label:"خطوبة"},{icon:"👑",label:"أبي"},{icon:"🌹",label:"المرأة"}];
  const BADGES = {new:{ar:"جديد",color:"#5c6848"},bestseller:{ar:"الأكثر مبيعاً",color:"#c9a84c"},sale:{ar:"عرض",color:"#c0392b"},exclusive:{ar:"حصري",color:"#6b4c8a"}};
  let DATA = {settings:{},products:[]};
  let cart = loadCart();
  const $ = (id) => document.getElementById(id);
  document.addEventListener("DOMContentLoaded", init);
  async function init() {
    $("year").textContent = new Date().getFullYear();
    await loadData(); applySettings(); renderTabs(); renderBestsellers(); renderShop("all"); renderOccasions(); updateCartUI(); bindEvents(); setupReveal();
  }
  async function loadData() {
    try { const r = await fetch("api.php?action=data",{cache:"no-store"}); if(r.ok){DATA=await r.json();return;} } catch{}
    try { DATA = await (await fetch("data/data.json",{cache:"no-store"})).json(); } catch { DATA={settings:{},products:[]}; }
  }
  function applySettings() {
    const s = DATA.settings||{};
    if(s.announcement) $("announce").textContent=s.announcement; else $("announce").style.display="none";
    const wa=(s.whatsapp||"").replace(/\D/g,"");
    const hello=encodeURIComponent(`مرحباً ${s.storeName||"عبير إيفنت"} 🌹، أرغب بالاستفسار`);
    const waUrl=wa?`https://wa.me/${wa}?text=${hello}`:"#";
    ["waContact","waFloat","footWa"].forEach(id=>{if($(id))$(id).href=waUrl;});
    ["igContact","footIg"].forEach(id=>{if($(id))$(id).href=s.instagram||"#";});
    if(s.email&&$("footEmail"))$("footEmail").textContent="✉️ "+s.email;
    if(s.currency)$("cartCurrency").textContent=s.currency;
  }
  function visibleProducts(){return(DATA.products||[]).filter(p=>p.visible!==false);}
  function finalPrice(p){const g=Number(DATA.settings?.globalDiscount||0);const d=Math.max(Number(p.discountPct||0),g);return Math.round(p.price*(1-d/100));}
  function effectiveDiscount(p){const g=Number(DATA.settings?.globalDiscount||0);return Math.max(Number(p.discountPct||0),g);}
  const curr=()=>DATA.settings?.currency||"ر.س";
  function cardHTML(p){
    const disc=effectiveDiscount(p),fp=finalPrice(p),badge=BADGES[p.badge];
    return `<article class="card"><div class="card-media">${badge?`<span class="badge" style="background:${badge.color}">${badge.ar}</span>"`:""} ${disc>0?`<span class="discount-tag">-${disc}%</span>`:""}<img src="${p.image}" alt="${p.nameAr}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect width=%22300%22 height=%22300%22 fill=%22%23ece6d6%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2280%22 text-anchor=%22middle%22 dy=%22.35em%22>🌹</text></svg>'" /></div><div class="card-body"><h3 class="card-name">${p.nameAr}</h3><p class="card-name-en">${p.nameEn||""}</p><div class="card-foot"><div class="price"><span class="price-now">${fp} <span>${curr()}</span></span>${disc>0?`<span class="price-old">${p.price} ${curr()}</span>`:""}</div><button class="add-btn" data-add="${p.id}">+</button></div></div></article>`;
  }
  function renderBestsellers(){const list=visibleProducts().filter(p=>p.badge==="bestseller").slice(0,8);$("bestsellersGrid").innerHTML=(list.length?list:visibleProducts().slice(0,8)).map(cardHTML).join("");}
  function renderTabs(){$("tabs").innerHTML=CATEGORIES.map((c,i)=>`<button class="tab${i===0?" active":""}" data-cat="${c.key}">${c.label}</button>`).join("");}
  function renderShop(cat){let list=visibleProducts();if(cat!=="all")list=list.filter(p=>p.category===cat);$("shopGrid").innerHTML=list.length?list.map(cardHTML).join(""):`<p class="muted" style="grid-column:1/-1;text-align:center">لا توجد منتجات</p>`;}
  function renderOccasions(){$("occasionsGrid").innerHTML=OCCASIONS.map(o=>`<div class="occasion" data-occasion="${o.label}"><span class="occasion-icon">${o.icon}</span><span>${o.label}</span></div>`).join("");}
  function loadCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch{return[];}}
  function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart));}
  function addToCart(id){const p=visibleProducts().find(x=>x.id===id);if(!p)return;const item=cart.find(i=>i.id===id);if(item)item.qty+=1;else cart.push({id,qty:1});saveCart();updateCartUI();toast(`أُضيف "${p.nameAr}" إلى السلة`);}
  function changeQty(id,d){const item=cart.find(i=>i.id===id);if(!item)return;item.qty+=d;if(item.qty<=0)cart=cart.filter(i=>i.id!==id);saveCart();updateCartUI();}
  function removeItem(id){cart=cart.filter(i=>i.id!==id);saveCart();updateCartUI();}
  function cartDetailed(){return cart.map(i=>{const p=visibleProducts().find(x=>x.id===i.id);return p?{...p,qty:i.qty,fp:finalPrice(p)}:null;}).filter(Boolean);}
  function updateCartUI(){
    const items=cartDetailed(),count=items.reduce((s,i)=>s+i.qty,0),total=items.reduce((s,i)=>s+i.qty*i.fp,0);
    $("cartCount").textContent=count; $("cartTotal").textContent=total;
    if(!items.length){$("cartBody").innerHTML=`<div class="cart-empty"><span class="big">🌼</span>سلتك فارغة<br/>أضف بعض الورود الجميلة</div>`;$("checkoutFields").style.display="none";$("checkoutBtn").disabled=true;$("checkoutBtn").style.opacity=".5";}
    else{$("cartBody").innerHTML=items.map(i=>`<div class="cart-row"><img src="${i.image}" alt="${i.nameAr}" /><div class="cart-row-info"><div class="cart-row-name">${i.nameAr}</div><div class="cart-row-price">${i.fp} ${curr()}</div><div class="qty"><button data-qty="${i.id}" data-d="-1">−</button><span>${i.qty}</span><button data-qty="${i.id}" data-d="1">+</button></div></div><button class="cart-remove" data-remove="${i.id}">🗑️</button></div>`).join("");$("checkoutFields").style.display="grid";$("checkoutBtn").disabled=false;$("checkoutBtn").style.opacity="1";}
  }
  function checkout(){
    const items=cartDetailed();if(!items.length)return;
    const total=items.reduce((s,i)=>s+i.qty*i.fp,0),s=DATA.settings||{},wa=(s.whatsapp||"").replace(/\D/g,"");
    if(!wa){toast("رقم واتساب غير مضبوط");return;}
    const name=$("custName").value.trim(),address=$("custAddress").value.trim(),date=$("custDate").value.trim(),note=$("custNote").value.trim();
    let msg=`*طلب جديد من ${s.storeName||"عبير إيفنت"}* 🌹\n\n`;
    items.forEach(i=>{msg+=`• ${i.nameAr} × ${i.qty} = ${i.qty*i.fp} ${curr()}\n`;});
    msg+=`\n*الإجمالي: ${total} ${curr()}*\n`;
    if(name)msg+=`\n👤 الاسم: ${name}`;
    if(address)msg+=`\n📍 العنوان: ${address}`;
    if(date)msg+=`\n📅 تاريخ الاستلام: ${date}`;
    if(note)msg+=`\n📝 ملاحظات: ${note}`;
    msg+=`\n\nأرغب بتأكيد الطلب 🌸`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`,"_blank");
  }
  function openCart(){var d=$("cartDrawer"),o=$("cartOverlay");d.style.display="flex";void d.offsetHeight;d.classList.add("open");o.classList.add("open");}
  function closeCart(){var d=$("cartDrawer"),o=$("cartOverlay");d.classList.remove("open");o.classList.remove("open");setTimeout(function(){if(!d.classList.contains("open"))d.style.display="none";},350);}
  function openMnav(){var n=$("mnav"),o=$("mnavOverlay");n.style.display="block";void n.offsetHeight;n.classList.add("open");o.classList.add("open");}
  function closeMnav(){var n=$("mnav"),o=$("mnavOverlay");n.classList.remove("open");o.classList.remove("open");setTimeout(function(){if(!n.classList.contains("open"))n.style.display="none";},350);}
  function bindEvents(){
    document.body.addEventListener("click",(e)=>{
      const add=e.target.closest("[data-add]"); if(add)return addToCart(add.dataset.add);
      const qty=e.target.closest("[data-qty]"); if(qty)return changeQty(qty.dataset.qty,Number(qty.dataset.d));
      const rm=e.target.closest("[data-remove]"); if(rm)return removeItem(rm.dataset.remove);
      const tab=e.target.closest(".tab"); if(tab){document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");renderShop(tab.dataset.cat);return;}
      const occ=e.target.closest("[data-occasion]"); if(occ)return orderOccasion(occ.dataset.occasion);
    });
    $("cartBtn").addEventListener("click",openCart); $("cartClose").addEventListener("click",closeCart); $("cartOverlay").addEventListener("click",closeCart);
    $("checkoutBtn").addEventListener("click",checkout);
    $("menuBtn").addEventListener("click",openMnav); $("mnavClose").addEventListener("click",closeMnav); $("mnavOverlay").addEventListener("click",closeMnav);
    $("mnav").addEventListener("click",(e)=>{if(e.target.tagName==="A")closeMnav();});
  }
  function orderOccasion(label){const s=DATA.settings||{},wa=(s.whatsapp||"").replace(/\D/g,"");if(!wa)return;window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`مرحباً ${s.storeName||"عبير إيفنت"} 🌹، أرغب بالاستفسار عن تنسيق: ${label}`)}`,"_blank");}
  function setupReveal(){const els=document.querySelectorAll(".reveal");if(!("IntersectionObserver"in window)){els.forEach(e=>e.classList.add("in"));return;}const io=new IntersectionObserver((entries)=>{entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});},{threshold:0.15});els.forEach(e=>io.observe(e));}
  let toastTimer;
  function toast(text){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}t.textContent=text;requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2000);}
})();
