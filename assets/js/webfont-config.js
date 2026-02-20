// WebFontConfig - Externalized for CSP compliance
WebFontConfig = {
    google: {
        families: ['Open+Sans:300,400,600,700,800', 'Poppins:200,300,400,500,600,700,800', 'Oswald:300,400,500,600,700,800'],
        display: 'swap'
    }
};
(function(d) {
    var wf = d.createElement('script'),
        s = d.scripts[0];
    wf.src = 'assets/js/webfont.js';
    wf.async = true;
    s.parentNode.insertBefore(wf, s);
})(document);

