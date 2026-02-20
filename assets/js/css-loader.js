// CSS Loader - Externalized for CSP compliance
!function(e){"use strict";var loadCSS=function(href,before,media){var doc=e.document;var ss=doc.createElement("link");var ref;if(before){ref=before}else{var refs=(doc.body||doc.getElementsByTagName("head")[0]).childNodes;ref=refs[refs.length-1]}var sheets=doc.styleSheets;ss.rel="stylesheet";ss.href=href;ss.media="only x";function ready(cb){if(doc.body)return cb();setTimeout(function(){ready(cb)})}ready(function(){ref.parentNode.insertBefore(ss,before?ref:ref.nextSibling)});var onloadcssdefined=function(cb){var resolvedHref=ss.href;var i=sheets.length;while(i--){if(sheets[i].href===resolvedHref)return cb()}setTimeout(function(){onloadcssdefined(cb)})};function loadCB(){if(ss.addEventListener)ss.removeEventListener("load",loadCB);ss.media=media||"all"}if(ss.addEventListener){ss.addEventListener("load",loadCB)}ss.onloadcssdefined=onloadcssdefined;onloadcssdefined(loadCB);return ss};e.loadCSS=loadCSS}(this);

// Load CSS asynchronously after script loads
(function() {
    function loadAsyncCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.crossOrigin = href.indexOf('//') > -1 ? 'anonymous' : null;
        document.head.appendChild(link);
    }
    
    // Load critical CSS
    loadAsyncCSS('assets/css/bootstrap.min.css');
    loadAsyncCSS('assets/css/demo21.min.css');
    loadAsyncCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
})();

