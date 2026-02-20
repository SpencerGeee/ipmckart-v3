(function() {
  "use strict";
  var links = document.querySelectorAll('link[rel="preload"][as="style"]');
  for (var i = 0; i < links.length; i++) {
    const link = links[i];
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
  }
})();
