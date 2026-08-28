const gamesBySystem={nes:[],snes:[],gb:[],gba:[]};
const social=[
  ["YouTube","https://www.youtube.com/@Tolis_TMG"],
  ["Facebook","https://www.facebook.com/"],
  ["Instagram","https://www.instagram.com/"],
  ["TikTok","https://www.tiktok.com/"],
  ["X / Twitter","https://x.com/"],
  ["Discord","https://discord.com/"]
];
const system=document.querySelector("#system"), game=document.querySelector("#game"), launch=document.querySelector("#launch"), socialGrid=document.querySelector("#socialGrid");
fetch("games.json").then(r=>r.json()).then(data=>{
  Object.assign(gamesBySystem,data);
  refreshGames();
}).catch(()=>{});
function refreshGames(){
  game.innerHTML='<option value="">Choose a ROM…</option>';
  for(const g of gamesBySystem[system.value]||[]){
    const o=document.createElement("option");o.value=g.url;o.textContent=g.title;game.appendChild(o);
  }
}
system.addEventListener("change",refreshGames);
social.forEach(([name,url])=>{
  const a=document.createElement("a");a.className="social-card";a.target="_blank";a.rel="noopener";a.href=url;
  a.innerHTML=`${name}<small>Open on PS5</small>`;socialGrid.appendChild(a);
});
launch.addEventListener("click",()=>{
  const url=game.value;
  if(!url){alert("Choose a game first.");return}
  if(!window.EJS_player){alert("Emulator engine has not been built into this page yet. Run the GitHub Pages workflow once.");return}
  window.EJS_gameUrl=url;
  window.EJS_core=system.value;
  window.EJS_pathtodata="vendor/emulatorjs/data/";
  window.EJS_player="#game";
  const s=document.createElement("script");s.src="vendor/emulatorjs/data/loader.js";document.body.appendChild(s);
});
