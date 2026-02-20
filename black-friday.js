(function(){document.addEventListener('DOMContentLoaded',function(){let grid=document.getElementById('black-friday-products');if(!grid){const fallback=document.querySelector('#black-friday-deals .product-grid');if(fallback)grid=fallback}
if(!grid)return;const DATA_URLS=['black-friday.json','flash-sales.json'];let allDeals=[];let renderedCount=0;const DEFAULT_BATCH=12;function formatPrice(price){if(price===null||typeof price!=='number')return'GHS 0.00';try{return new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'}).format(price)}catch(e){return'GHS '+(Math.round((price+Number.EPSILON)*100)/100).toFixed(2)}}
function escapeHtml(text){if(typeof text!=='string')return'';const div=document.createElement('div');div.textContent=text;return div.innerHTML}
function escapeAttr(text){if(typeof text!=='string')return'';return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function computeDiscount(regular,sale){if(typeof regular!=='number'||typeof sale!=='number'||regular<=0)return 0;return Math.max(0,Math.round(((regular-sale)/regular)*100))}
function cardTemplate(p){const id=escapeAttr(p.id||'');const name=escapeHtml(p.name||'');const img1=escapeAttr((p.blackFridayImage||p.flashSaleImage||(p.images&&p.images[0])||'assets/images/placeholder.webp"'));const oldPrice=typeof p.price==='number'?p.price:null;const salePrice=(typeof p.blackFridayPrice==='number')?p.blackFridayPrice:(typeof p.flashSalePrice==='number'?p.flashSalePrice:null);const discount=computeDiscount(oldPrice,salePrice);const sold=typeof p.blackFridaySold==='number'?p.blackFridaySold:(typeof p.flashSaleStock==='number'?Math.floor(p.flashSaleStock*0.4):0);const stock=typeof p.blackFridayStock==='number'?p.blackFridayStock:(typeof p.flashSaleStock==='number'?p.flashSaleStock:100);const pct=stock>0?Math.min(100,Math.round((sold/stock)*100)):0;return `
        <div class="product-card">
          ${discount>0 ? `<span class="black-friday-badge">${discount}%OFF</span>` : ''}
          <figure>
            <a href="product.html?id=${id}" aria-label="View ${name}">
              <img src="${img1}" alt="${escapeAttr(name)}" loading="lazy">
            </a>
          </figure>
          <div class="product-details">
            <h3 class="product-title"><a href="product.html?id=${id}">${name}</a></h3>
            <div class="price-box">
              ${oldPrice!=null ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ''}
              ${salePrice!=null ? `<span class="product-price">${formatPrice(salePrice)}</span>` : ''}
              ${discount>0 ? `<span class="discount-badge">${discount}%OFF</span>` : ''}
            </div>
            <div class="progress-container">
              <div class="progress-label">
                <span>Sold: ${sold}/${stock}</span>
                <span class="sold-count">${pct>80?'Almost Gone!':(pct>50?'Limited Stock!':'Hot Deal!')}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
            </div>
            <div class="product-action">
              <button class="btn-add-cart" data-product-id="${id}" type="button">Add to Cart</button>
            </div>
          </div>
        </div>`}
async function fetchDeals(){for(const url of DATA_URLS){try{const res=await fetch(url);if(!res.ok)continue;const data=await res.json();if(data&&Array.isArray(data.blackFriday)&&data.blackFriday.length){return data.blackFriday}
if(data&&Array.isArray(data.flashSales)&&data.flashSales.length){return data.flashSales}}catch(e){}}
return[]}
function renderNextBatch(batchSize){const start=renderedCount;const end=Math.min(allDeals.length,renderedCount+batchSize);const slice=allDeals.slice(start,end);const html=slice.map(cardTemplate).join('');const tmp=document.createElement('div');tmp.innerHTML=html;while(tmp.firstChild){grid.appendChild(tmp.firstChild)}
renderedCount=end;if(renderedCount>=allDeals.length){const btn=document.getElementById('bf-load-more');if(btn)btn.style.display='none'}}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function init(){const limitAttr=grid.dataset.limit?parseInt(grid.dataset.limit,10):Infinity;allDeals=await fetchDeals();if(!allDeals.length){grid.innerHTML='<p class="col-12 text-center">No Black Friday deals available. Check back soon!</p>';const btn=document.getElementById('bf-load-more');if(btn)btn.style.display='none';return}
allDeals=shuffle(allDeals.filter(p=>p.active!==!1));try{grid.innerHTML=''}catch(e){}
const initialBatch=Math.min(DEFAULT_BATCH,limitAttr);renderNextBatch(initialBatch);let btn=document.getElementById('bf-load-more');if(!btn){const candidateButtons=Array.from(document.querySelectorAll('#black-friday-deals button'));btn=candidateButtons.find(b=>/load\s*more/i.test(b.textContent||''))||null}
if(btn){btn.addEventListener('click',function(){const remaining=(limitAttr===Infinity?allDeals.length:limitAttr)-renderedCount;renderNextBatch(Math.min(DEFAULT_BATCH,Math.max(0,remaining)))})}}
grid.addEventListener('click',function(e){const btn=e.target.closest('.btn-add-cart');if(!btn)return;const id=btn.getAttribute('data-product-id');if(window.CartManager&&typeof window.CartManager.addToCart==='function'){window.CartManager.addToCart(id, 1, { theme: "black-friday" });const original=btn.textContent;btn.textContent='Added!';setTimeout(()=>btn.textContent=original,1500)}});init()})})();function computeBlackFridayCountdownTarget(){const now=new Date();const year=now.getFullYear();let target=new Date(year,10,30,23,59,59,999);if(target<now){target=new Date(year+1,10,30,23,59,59,999)}
return target}
function initializeBlackFriday(){const countDownDate=computeBlackFridayCountdownTarget().getTime();const countdownFunction=setInterval(function(){const now=new Date().getTime();const distance=countDownDate-now;const days=Math.floor(distance/(1000*60*60*24));const hours=Math.floor((distance%(1000*60*60*24))/(1000*60*60));const minutes=Math.floor((distance%(1000*60*60))/(1000*60));const seconds=Math.floor((distance%(1000*60))/1000);const daysEl=document.getElementById("bf-days");const hoursEl=document.getElementById("bf-hours");const minutesEl=document.getElementById("bf-minutes");const secondsEl=document.getElementById("bf-seconds");if(daysEl)daysEl.innerHTML=days.toString().padStart(2,'0');if(hoursEl)hoursEl.innerHTML=hours.toString().padStart(2,'0');if(minutesEl)minutesEl.innerHTML=minutes.toString().padStart(2,'0');if(secondsEl)secondsEl.innerHTML=seconds.toString().padStart(2,'0');if(distance<0){clearInterval(countdownFunction);if(daysEl)daysEl.innerHTML="00";if(hoursEl)hoursEl.innerHTML="00";if(minutesEl)minutesEl.innerHTML="00";if(secondsEl)secondsEl.innerHTML="00"}},1000)}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initializeBlackFriday)}else{initializeBlackFriday()}