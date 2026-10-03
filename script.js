const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const types=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];
const ranks=["S","A+","A","B+","B"];
let players=[];
let deleted=[];
let active="All";
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
async function loadPlayers(){const{data,error}=await db.from("players").select("*");if(error){console.error(error);$("rankingList").innerHTML="<div>Database error: "+esc(error.message)+"</div>";return}players=data||[];render()}
function render(){let q=$("search").value.toLowerCase();let list=players.filter(p=>p.name.toLowerCase().includes(q));if(active!=="All")list=list.filter(p=>p.pvp_type===active);list.sort((a,b)=>ranks.indexOf(a.tier)-ranks.indexOf(b.tier)||a.name.localeCompare(b.name));$("filters").innerHTML=["All",...types].map(x=>`<button class="${x===active?"active":""}" data-cat="${esc(x)}">${esc(x)}</button>`).join("");$("count").textContent=list.length+" players";$("rankingList").innerHTML=list.length?list.map((p,i)=>`<div class="rank"><b>#${i+1}</b><div class="player"><div class="avatar">${esc(p.name.charAt(0))}</div><div><div class="name">${esc(p.name)}</div><div class="sub">PvP Type: ${esc(p.pvp_type)} • Rank: ${esc(p.tier)}</div></div></div><div class="tier">${esc(p.tier)}</div></div>`).join(""):"<div>No players found.</div>";$("playerGrid").innerHTML=list.map(p=>`<div class="profile card glass"><h3>${esc(p.name)}</h3><div class="tiers"><div class="mini"><span>PvP Type</span><b>${esc(p.pvp_type)}</b></div><div class="mini"><span>Rank</span><b>${esc(p.tier)}</b></div></div></div>`).join("")}
function adminRender(){let html=`<button id="saveChanges" class="saveButton">💾 Save Changes</button>`;players.forEach((p,i)=>{html+=`<div class="adminPlayer"><b>👤 ${esc(p.name)}</b><input class="adminInput" value="${esc(p.name)}" data-name="${i}" placeholder="Player name"><div class="adminGrid"><select data-player="${i}" data-type="pvp_type">${types.map(x=>`<option value="${esc(x)}" ${p.pvp_type===x?"selected":""}>${esc(x)}</option>`).join("")}</select><select data-player="${i}" data-type="tier">${ranks.map(x=>`<option value="${x}" ${p.tier===x?"selected":""}>${x}</option>`).join("")}</select></div><button class="danger" data-remove="${i}">🗑 Remove</button></div>`});$("adminPlayers").innerHTML=html}
async function saveChanges(){const btn=$("saveChanges");btn.disabled=true;btn.textContent="⏳ Saving...";try{if(players.length){const{error}=await db.from("players").upsert(players.map(p=>({id:p.id,name:p.name,pvp_type:p.pvp_type,tier:p.tier})),{onConflict:"id"});if(error)throw error}if(deleted.length){const{error}=await db.from("players").delete().in("id",deleted);if(error)throw error}deleted=[];btn.textContent="✅ Saved!";await loadPlayers();setTimeout(()=>btn.textContent="💾 Save Changes",1500)}catch(e){console.error(e);btn.disabled=false;btn.textContent="❌ Save failed";alert(e.message)}}
async function login(){const email=$("loginEmail").value.trim();const password=$("loginPass").value.trim();if(!email||!password){$("loginError").textContent="Enter your email and password.";return}const{data,error}=await db.auth.signInWithPassword({email,password});if(error){$("loginError").textContent=error.message;console.error(error);return}if(data.session){$("loginError").textContent="";$("loginModal").classList.remove("show");$("adminModal").classList.add("show");adminRender()}else{$("loginError").textContent="Login failed. No session was created."}}
function toggleMenu(){$("sideMenu").classList.toggle("open")}
$("menuBtn").onclick=toggleMenu;
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{$(b.dataset.go).scrollIntoView({behavior:"smooth"});$("sideMenu").classList.remove("open")});
$("loginBtn").onclick=()=>{$("sideMenu").classList.remove("open");$("loginModal").classList.add("show");$("loginError").textContent=""};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove("show"));
$("loginSubmit").onclick=login;
$("loginPass").onkeydown=e=>{if(e.key==="Enter")login()};
$("search").oninput=render;
$("filters").onclick=e=>{if(e.target.dataset.cat){active=e.target.dataset.cat;render()}};
$("addPlayer").onclick=()=>{const n=$("newName").value.trim();if(!n)return;if(players.some(p=>p.name.toLowerCase()===n.toLowerCase())){alert("Player already exists");return}players.push({id:crypto.randomUUID(),name:n,pvp_type:"Sword",tier:"B"});$("newName").value="";adminRender();render()};
$("adminPlayers").onchange=e=>{const i=e.target.dataset.player;if(i!==undefined){players[Number(i)][e.target.dataset.type]=e.target.value;render()}const n=e.target.dataset.name;if(n!==undefined){const name=e.target.value.trim();if(name)players[Number(n)].name=name;render()}};
$("adminPlayers").onclick=e=>{const i=e.target.dataset.remove;if(i!==undefined){const p=players.splice(Number(i),1)[0];if(p&&p.id)deleted.push(p.id);adminRender();render()}if(e.target.id==="saveChanges")saveChanges()};
db.channel("outlast-tiers-live").on("postgres_changes",{event:"*",schema:"public",table:"players"},()=>loadPlayers()).subscribe();
setInterval(()=>{$("liveText").textContent="LIVE • Updated "+new Date().toLocaleTimeString()},1000);
loadPlayers();
