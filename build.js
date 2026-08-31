const fs=require("fs"), path=require("path");
const ROOT=__dirname, OUT=path.join(ROOT,"dist");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=s=>String(s).toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const DEFAULT_IMAGE="/images/platzhalter-rezept.png";
const recipeImage=r=>r.image||DEFAULT_IMAGE;
const totalTime=r=>(r.details&&r.details.total_time)||r.time||"";
const prepTime=r=>(r.details&&r.details.prep_time)||"";
const cookTime=r=>(r.details&&r.details.cook_time)||"";
function durationToISO(v){
  if(!v) return undefined;
  const s=String(v).toLowerCase().replace(",",".");
  let mins=0;
  const h=s.match(/(\d+(?:\.\d+)?)\s*(?:std|stunde|stunden|h)\b/);
  const m=s.match(/(\d+)\s*(?:min|minute|minuten)\b/);
  if(h) mins+=Math.round(parseFloat(h[1])*60);
  if(m) mins+=parseInt(m[1],10);
  if(!mins && /^\s*\d+\s*$/.test(s)) mins=parseInt(s,10);
  if(!mins) return undefined;
  const hours=Math.floor(mins/60), rem=mins%60;
  return `PT${hours?hours+"H":""}${rem?rem+"M":""}`;
}
function cleanTags(tags){
  if(!Array.isArray(tags)) return [];
  return tags.map(t=>typeof t==="string"?t:(t&&t.tag)||"").filter(Boolean);
}
const subcats={Kochen:["Hauptgerichte","Pasta & Pizza","Salate","Beilagen","Saucen & Dips","Snacks"],Backen:["Süß","Herzhaft"]};
function cp(src,dst){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,e.name),b=path.join(dst,e.name);e.isDirectory()?cp(a,b):fs.copyFileSync(a,b)}}
if(fs.existsSync(OUT))fs.rmSync(OUT,{recursive:true});fs.mkdirSync(OUT,{recursive:true});cp(path.join(ROOT,"static"),OUT);
const dir=path.join(ROOT,"content","recipes");
function parseRecipeDate(v){
  if(!v) return 0;
  const value=String(v).trim();
  const de=value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:T|\s)?(\d{2})?:?(\d{2})?/);
  if(de){
    const [,dd,mm,yyyy,hh="00",min="00"]=de;
    return new Date(Number(yyyy),Number(mm)-1,Number(dd),Number(hh),Number(min)).getTime();
  }
  const parsed=Date.parse(value);
  return Number.isNaN(parsed)?0:parsed;
}
const recipes=fs.readdirSync(dir)
  .filter(f=>f.endsWith(".json"))
  .map(f=>({...JSON.parse(fs.readFileSync(path.join(dir,f),"utf8")),_file:f,_slug:f.replace(/\.json$/,"")}))
  .sort((a,b)=>parseRecipeDate(b.date)-parseRecipeDate(a.date));
const sidebar=(active="")=>`<aside class="recipe-sidebar"><div class="sidebar-inner">${Object.entries(subcats).map(([cat,subs])=>`<section class="sidebar-group"><p>${cat.toUpperCase()}</p>${subs.map(s=>`<a class="${active===s?"active":""}" href="/kategorie-${slug(s)}.html">${esc(s)}</a>`).join("")}</section>`).join("")}</div></aside>`;
const SITE="https://maggisrezepte.de";
const head=(title,desc="",canonical="/")=>`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${canonical}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${canonical}"><meta property="og:type" content="website"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"></head><body><header class="site-header"><div class="header-inner"><a class="brand" href="/">MaggisRezepte</a><label class="search-box"><span>⌕</span><input id="search" type="search" placeholder="Rezept suchen…"></label></div></header>`;
const card=r=>`<a class="recipe-card" href="/${r._slug}/" data-search="${esc(`${r.title} ${r.category} ${r.subcategory}`.toLowerCase())}"><div class="thumb" style="background-image:url('${esc(recipeImage(r))}')"></div><div class="recipe-info"><small>${esc(r.category.toUpperCase())} · ${esc(r.subcategory.toUpperCase())}</small><h3>${esc(r.title)}</h3><p>${esc(totalTime(r))} · ${esc(r.servings)}</p></div><span class="arrow">→</span></a>`;
const catCards=()=>`<div class="home-category-grid">${Object.entries(subcats).map(([cat,subs])=>`<article class="home-category-card"><div class="tape"></div><p class="card-label">${cat.toUpperCase()}</p><h2>${cat}</h2><nav>${subs.map(s=>`<a href="/kategorie-${slug(s)}.html">${esc(s)} <span>›</span></a>`).join("")}</nav></article>`).join("")}</div>`;
const home=`${head("MaggisRezepte – Mein digitales Rezept-Notizbuch","Einfache Rezepte zum Kochen und Backen.","/")}<main class="home-layout">${sidebar()}<section class="home-paper"><div class="section-heading home-heading"><span>01</span><h1>Kategorien</h1></div>${catCards()}<div class="paper-divider"></div><div class="section-heading"><span>02</span><h2>Neue Rezepte</h2></div><div id="recipe-list" class="recipe-list home-recipe-list">${recipes.slice(0,6).map(card).join("")}</div></section></main><footer class="site-footer"><div><strong>MaggisRezepte</strong><span>Mein digitales Rezept-Notizbuch</span></div><nav><a href="#">Datenschutz</a><a href="#">Impressum</a></nav></footer><script src="/script.js"></script></body></html>`;
fs.writeFileSync(path.join(OUT,"index.html"),home);
for(const r of recipes){
 const jsonld={
   "@context":"https://schema.org",
   "@type":"Recipe",
   "name":r.title,
   "url":`${SITE}/${r._slug}/`,
   "description":r.seo_description||r.description||undefined,
   "image":[recipeImage(r)],
   "datePublished":r.date||undefined,
   "recipeCategory":r.subcategory||r.category,
   "keywords":cleanTags(r.tags).join(", ")||undefined,
   "prepTime":durationToISO(prepTime(r)),
   "cookTime":durationToISO(cookTime(r)),
   "totalTime":durationToISO(totalTime(r)),
   "recipeYield":r.servings,
   "recipeIngredient":r.ingredients,
   "recipeInstructions":r.steps.map(x=>({"@type":"HowToStep","text":x}))
 };
 const page=`${head(`${r.title} – MaggisRezepte`,r.seo_description||r.description||`${r.title} – einfaches Rezept.`,`/${r._slug}/`)}<main class="recipe-layout">${sidebar(r.subcategory)}<article class="recipe-paper"><nav class="breadcrumb"><a href="/">Startseite</a><span>›</span><a href="/kategorie-${slug(r.subcategory)}.html">${esc(r.category)}</a><span>›</span><a href="/kategorie-${slug(r.subcategory)}.html">${esc(r.subcategory)}</a></nav><h1>${esc(r.title)}</h1><div class="meta-row"><span>◷ ${esc(totalTime(r))}</span><span>♙ ${esc(r.servings)}</span><span>▥ ${esc(r.difficulty)}</span></div>${r.description?`<p class="recipe-intro">${esc(r.description)}</p>`:""}${(prepTime(r)||cookTime(r))?`<div class="time-detail">${prepTime(r)?`<span>Vorbereitung: <strong>${esc(prepTime(r))}</strong></span>`:""}${cookTime(r)?`<span>Koch-/Backzeit: <strong>${esc(cookTime(r))}</strong></span>`:""}</div>`:""}${`<figure class="recipe-image"><div class="photo-tape"></div><img src="${esc(recipeImage(r))}" alt="${esc(r.image_alt||"Rezeptfoto folgt")}"></figure>`}<section class="recipe-section"><h2><span>Zutaten</span></h2><ul>${(r.ingredients||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section><section class="recipe-section"><h2><span>Zubereitung</span></h2><ol>${(r.steps||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol></section>${r.notes?`<section class="recipe-section"><h2><span>Notizen</span></h2><p>${esc(r.notes)}</p></section>`:""}<button class="print-button" onclick="window.print()">▣ &nbsp; Rezept drucken</button></article></main><script type="application/ld+json">${JSON.stringify(jsonld)}</script></body></html>`;
 const recipeDir=path.join(OUT,r._slug); fs.mkdirSync(recipeDir,{recursive:true}); fs.writeFileSync(path.join(recipeDir,"index.html"),page);
}
for(const [cat,subs] of Object.entries(subcats))for(const sub of subs){
 const found=recipes.filter(r=>r.subcategory===sub);
 const p=`${head(`${sub} – MaggisRezepte`,`${sub} Rezepte`,`/kategorie-${slug(sub)}.html`)}<main class="recipe-layout">${sidebar(sub)}<section class="home-paper category-page"><div class="section-heading home-heading"><span>${esc(cat.toUpperCase())}</span><h1>${esc(sub)}</h1></div><div id="recipe-list" class="recipe-list home-recipe-list">${found.length?found.map(card).join(""):`<p>Hier gibt es noch keine Rezepte.</p>`}</div></section></main><script src="/script.js"></script></body></html>`;
 fs.writeFileSync(path.join(OUT,`kategorie-${slug(sub)}.html`),p);
}
console.log(`MaggisRezepte gebaut: ${recipes.length} Rezepte`);

// SEO: sitemap, robots and compatibility redirects
const urls=[
  {loc:`${SITE}/`,lastmod:null},
  ...recipes.map(r=>({loc:`${SITE}/${r._slug}/`,lastmod:r.date||null})),
  ...Object.values(subcats).flat().map(sub=>({loc:`${SITE}/kategorie-${slug(sub)}.html`,lastmod:null}))
];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u.loc}</loc>${u.lastmod?`<lastmod>${String(u.lastmod).slice(0,10)}</lastmod>`:""}</url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(OUT,"sitemap.xml"),sitemap);
fs.writeFileSync(path.join(OUT,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const redirects=recipes.map(r=>`/rezept-${r._slug}.html /${r._slug}/ 301`).join("\n")+"\n";
fs.writeFileSync(path.join(OUT,"_redirects"),redirects);
