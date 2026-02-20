!function(){
  function a(a,t,n){return Math.max(t,Math.min(n,a))}
  
  function t(t,n,r){
    // Calculate discount
    var d=Math.round((t.price-t.blackFridayPrice)/t.price*100);
    // Calculate progress bar width
    var i=function(t,n){return a(n>0?Math.round(t/n*100):0,0,100)}(n,r);
    // Get Image
    var e=t.images&&t.images[0]?t.images[0]:"";
    
    // RENDER HTML
    // Note: 'product-info-upper' groups the top content tightly to remove gaps
    return '<div class="product-card christmas-card" data-bf-id="'+t.id+'">\n'+
      '  <div class="christmas-badge">🎄 -'+d+'% OFF</div>\n'+
      '  <figure>\n'+
      '    <a href="product.html?id='+t.id+'">\n'+
      '      <img src="'+e+'" alt="'+t.name+'" loading="lazy">\n'+
      '    </a>\n'+
      '  </figure>\n'+
      '  <div class="product-details">\n'+
      '    <div class="product-info-upper">\n'+ 
      '      <h3 class="product-title">\n'+
      '        <a href="product.html?id='+t.id+'">'+t.name+'</a>\n'+
      '      </h3>\n'+
      '      <div class="price-box">\n'+
      '        <span class="old-price">GH₵'+Number(t.price).toFixed(2)+'</span>\n'+
      '        <span class="product-price">GH₵'+Number(t.blackFridayPrice).toFixed(0)+'</span>\n'+
      '      </div>\n'+
      '      <div class="progress-container">\n'+
      '        <div class="progress-label">\n'+
      '          <span class="sold-count">🔥 Selling Fast!</span>\n'+
      '          <span class="percent-text">'+i+'% Sold</span>\n'+
      '        </div>\n'+
      '        <div class="progress-bar">\n'+
      '          <div class="progress-fill" style="width: '+i+'%"></div>\n'+
      '        </div>\n'+
      '      </div>\n'+
      '    </div>\n'+ 
      '    <div class="product-action">\n'+
      '      <button class="btn btn-add-cart" data-product-id="'+t.id+'">ADD TO CART</button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '</div>'}

  document.addEventListener("DOMContentLoaded",(function(){
    var n=document.getElementById("black-friday-products");
    n&&fetch("black-friday.json").then((function(a){return a.json()})).then((function(r){
      var d=parseInt(n.getAttribute("data-limit")||"12",10),
      i=(r&&r.blackFriday?r.blackFriday:[]).filter((function(a){return a&&a.active})).slice(0,d).map((function(n){
        return t(n,function(t){
          var n=Number(t.blackFridayStock||0),
          r=Number(t.blackFridaySold||0),
          d=Math.max(0,Math.floor(.3*n));
          return a(r+Math.floor(Math.random()*(d+1)),0,n)}(n),Number(n.blackFridayStock||0))
      })).join("");
      n.innerHTML=i,n.dataset.cartBound||(n.addEventListener("click",(function(a){
        var t=a.target.closest?a.target.closest(".btn btn-add-cart, .btn-add-cart"):null;
        if(t){
          var n=t.getAttribute("data-product-id");
          if(window.CartManager&&"function"==typeof window.CartManager.addToCart){
            window.CartManager.addToCart(n,1,{theme:"black-friday"});
            var r=t.textContent;
            t.disabled=!0,
            t.textContent="Added 🎅",
            t.style.background="#27ae60"; 
            t.style.borderColor="#27ae60";
            setTimeout((function(){
                t.disabled=!1,
                t.textContent="ADD TO CART",
                t.style.background="",
                t.style.borderColor=""
            }),1500)
          }
        }
      })),n.dataset.cartBound="1")
    })).catch((function(a){console.error("Error loading Black Friday products:",a)}))
  }))
}();