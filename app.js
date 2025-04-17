/* ---------- restaurant data --------- */
const restaurants = [
  // 🔄  Replace / extend with your real list
  {
    name:"Trattoria Milanese",category:"Trattoria",
    description:"Osso Buco & Risotto alla Milanese in a historic room.",
    type:"Milanese",address:"Via Santa Marta 11, Milano",
    rating:4.3,priceRange:"€€€",latitude:45.4631,longitude:9.1837,
    website:"https://www.trattoriamilanese.it/"
  },
  // …
];

/* ---------- DOM handles ---------- */
const $filters   = document.getElementById('filters');
const $list      = document.getElementById('list');
const $themeBtn  = document.getElementById('themeToggle');
const $mapElm    = document.getElementById('map');
const doc        = document.documentElement;

/* ---------- dark‑mode ---------- */
function applyTheme(t){
  doc.dataset.theme = t==='dark' ? 'dark' : '';
  $themeBtn.firstElementChild.innerHTML =
    t==='dark'
      ? '<path d="M12 18a6 6 0 010-12v12z"/>'      // sun
      : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'; // moon
  localStorage.setItem('theme',t);
}
$themeBtn.onclick = ()=>applyTheme(doc.dataset.theme==='dark'?'light':'dark');
applyTheme(localStorage.getItem('theme')||'light');

/* ---------- build filters ---------- */
function buildFilters(){
  const cats=[...new Set(restaurants.map(r=>r.category))].sort();
  const types=[...new Set(restaurants.map(r=>r.type))].sort();

  $filters.innerHTML = `
    <input id="search" placeholder="Search…" class="w-full input">
    <select id="cat"  class="w-full input"><option value="">All Categories</option>
      ${cats.map(c=>`<option>${c}</option>`).join('')}</select>
    <select id="type" class="w-full input"><option value="">All Types</option>
      ${types.map(t=>`<option>${t}</option>`).join('')}</select>
    <select id="sort" class="w-full input">
      <option value="name-asc">Name A–Z</option>
      <option value="name-desc">Name Z–A</option>
      <option value="rating-desc">Rating ↓</option>
      <option value="rating-asc">Rating ↑</option>
      <option value="price-desc">Price ↓</option>
      <option value="price-asc">Price ↑</option>
    </select>`;
  ['search','cat','type','sort'].forEach(id=>
    document.getElementById(id).addEventListener('input',refresh));
}

/* ---------- map ---------- */
let map, cluster;
function initMap(){
  map     = L.map($mapElm).setView([45.4642,9.19],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              {attribution:'© OpenStreetMap'}).addTo(map);
  cluster = L.markerClusterGroup(); map.addLayer(cluster);
  refresh();
}
new IntersectionObserver(([e])=>{
  if(e.isIntersecting){initMap();}} ,{rootMargin:'200px'}).observe($mapElm);

/* ---------- render ---------- */
function refresh(){
  if(!map) return;               // wait for lazy map
  const q   = (document.getElementById('search')||{}).value?.toLowerCase()||'';
  const cat = (document.getElementById('cat')||{}).value||'';
  const typ = (document.getElementById('type')||{}).value||'';
  const ord = (document.getElementById('sort')||{}).value||'name-asc';

  let list = restaurants.filter(r=>
      (!q  || r.name.toLowerCase().includes(q)||r.description.toLowerCase().includes(q)) &&
      (!cat|| r.category===cat) &&
      (!typ|| r.type===typ));

  const sorters={
    'name-asc':  (a,b)=>a.name.localeCompare(b.name),
    'name-desc': (a,b)=>b.name.localeCompare(a.name),
    'rating-desc':(a,b)=>b.rating-a.rating,
    'rating-asc': (a,b)=>a.rating-b.rating,
    'price-desc': (a,b)=>b.priceRange.length-a.priceRange.length,
    'price-asc':  (a,b)=>a.priceRange.length-b.priceRange.length
  };
  list.sort(sorters[ord]);

  /* list -> HTML */
  $list.innerHTML = list.length
    ? list.map(r=>`
      <div class="card" onclick="flyTo(${r.latitude},${r.longitude})">
        <h3 class="text-lg font-semibold mb-1">${r.name}</h3>
        <p class="text-sm mb-1">${r.description}</p>
        <div class="text-xs flex gap-2 flex-wrap">
          <span class="chip">${r.category}</span>
          <span class="chip">${r.type}</span>
          <span class="chip">${r.rating.toFixed(1)} ★</span>
          <span class="chip">${r.priceRange}</span>
        </div>
      </div>`).join('')
    : '<p class="text-center text-sm opacity-75 py-10">No matches</p>';

  /* list -> map */
  cluster.clearLayers();
  list.forEach(r=>{
    const m=L.marker([r.latitude,r.longitude]);
    m.bindPopup(`<strong>${r.name}</strong><br>${r.rating.toFixed(1)} ★ · ${r.priceRange}`);
    m.on('click',()=>document
             .querySelector(`.card:nth-child(${list.indexOf(r)+1})`)
             .scrollIntoView({behavior:'smooth',block:'center'}));
    cluster.addLayer(m);
  });
}
window.flyTo=(lat,lng)=>map.flyTo([lat,lng],17,{duration:.6});

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded',()=>{buildFilters();});
