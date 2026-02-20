// assets/js/repairs-upgrade-init.js
// Animation on scroll functionality
function animateOnScroll() {
  const elements = document.querySelectorAll('.page-title, .trusted-badge, .service-card, .form-section, .location-card, .map-credits, .section-heading, .animated-element');
  elements.forEach(element => {
    const elementPosition = element.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.3;
    if (elementPosition < screenPosition) element.classList.add('animated');
  });
}
window.addEventListener('load', animateOnScroll);
const onScrollThrottled = (window.Utils && window.Utils.throttle) ? window.Utils.throttle(animateOnScroll, 100) : animateOnScroll;
window.addEventListener('scroll', onScrollThrottled, { passive: true });

// Initialize map
function initMap() {
  const myLatLng = { lat: 5.635021, lng: -0.175699 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: myLatLng,
    styles: [
      {"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},
      {"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},
      {"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},
      {"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},
      {"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},
      {"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},
      {"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},
      {"featureType":"water","elementType":"all","stylers":[{"color":"#dde6f0"},{"visibility":"on"}]}
    ]
  });
  new google.maps.Marker({
    position: myLatLng,
    map,
    title: "IPMC Service Center",
    icon: { url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.webp" }
  });
}
