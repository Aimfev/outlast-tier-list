const{createClient}=supabase;
const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
const db=createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const types=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];
const ranks=["S","A+","A","B+","B"];
let active="All";
let players=[];
let deleted=[];
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
async function loadPlayers(){const{data,error}=await db.from("players").select("*").order("tier",{ascending:true}).order("name",{ascending:true});if(error){console.error(error);alert("Could not load players: "+error.message);return}players=data||[];render()}
function render(){let q=$("search").value.toLowerCase();let list=players.filter(p=>p.name.toLowerCase().includes(q));if(active!=="All")list=list.filter(p=>p.pvp_type===active);list.sort((a,b)=>ranks.indexOf(a.tier)-ranks.indexOf(b.tier)||a.name.localeCompare(b.name));$("filters").innerHTML=["All",...types].map(x=>`<button class="${x===active?"active":""}" data-cat="${esc(x)}">${esc(x)}</button>`).join("");$("count").textContent=list.length+" players";$("rankingList").innerHTML=list.length?list.map((p,i)=>`<div class="rank"><b>#${i+1}</b><div class="player"><div class="avatar">${esc(p.name[0]||"?")}</div><div><div class="name">${esc(p.name)}</div><div class="sub">PvP Type: ${esc(p.pvp_type)} • Rank: ${esc(p.tier)}</div></div></div><div class="tier">${esc(p.tier)}</div></div>`).join(""):"<div>No players found.</div>";$("playerGrid").innerHTML=list.map(p=>`<div class="profile card glass"><h3>${esc(p.name)}</h3><div class="tiers"><div class="mini"><span>PvP Type</span><b>${esc(p.pvp_type)}</b></div><div class="mini"><span>Rank</span><b>${esc(p.tier)}</b></div></div></div>`).join("")}
function adminRender(){if(!players.length){$("adminPlayers").innerHTML=`<button id="saveChanges" class="saveButton">💾 Save Changes</button><div class="statusMsg">No players.</div>`}else{$("adminPlayers").innerHTML=`<button id="saveChanges" class="saveButton">💾 Save Changes</button><div id="saveStatus"></div>${players.map((p,i)=>`<div class="adminPlayer"><b>👤 ${esc(p.name)}</b><input class="adminInput" value="${esc(p.name)}" data-name="${i}" placeholder="Player name"><div class="adminGrid"><select data-player="${i}" data-type="pvp_type">${types.map(x=>`<option value="${esc(x)}" ${p.pvp_type===x?"selected":""}>${esc(x)}</option>`).join("")}</select><select data-player="${i}" data-type="tier">${ranks.map(x=>`<option value="${esc(x)}" ${p.tier===x?"selected":""}>${x}</option>`).join("")}</select></div><button class="danger" data-remove="${i}">🗑 Remove</button></div>`).join("")}$("saveChanges").onclick=saveChanges}}
async function saveChanges(){let btn=$("saveChanges");btn.disabled=true;btn.textContent="⏳ Saving...";try{if(players.length){const{error}=await db.from("players").upsert(players.map(p=>({id:p.id,name:p.name,pvp_type:p.pvp_type,tier:p.tier})),{onConflict:"id"});if(error)throw error}if(deleted.length){const{error}=await db.from("players").delete().in("id",deleted);if(error)throw error}deleted=[];btn.textContent="✅ Saved!";$("saveStatus").innerHTML=`<div class="statusMsg">Changes saved for everyone.</div>`;setTimeout(()=>{btn.textContent="💾 Save Changes"},1800)}catch(e){console.error(e);btn.textContent="❌ Save failed";alert("Save failed: "+e.message)}finally{btn.disabled=false}}
async function login(){let email=$("loginEmail").value.trim(),password=$("loginPass").value;let{error}=await db.auth.signInWithPassword({email,password});if(error){$("loginError").textContent=error.message;return}$("loginError").textContent="";close("loginModal");$("adminModal").classList.add("show");adminRender()}
function toggleMenu(){$("sideMenu").classList.toggle("open")}
function close(id){$(id).classList.remove("show")}
$("menuBtn").onclick=toggleMenu;
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{$(b.dataset.go).scrollIntoView({behavior:"smooth"});$("sideMenu").classList.remove("open")});
$("loginBtn").onclick=()=>{$("sideMenu").classList.remove("open");$("loginModal").classList.add("show")};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
$("loginSubmit").onclick=login;
$("loginPass").onkeydown=e=>{if(e.key==="Enter")login()};
$("search").oninput=render;
$("filters").onclick=e=>{if(e.target.dataset.cat){active=e.target.dataset.cat;render()}};
$("addPlayer").onclick=()=>{let n=$("newName").value.trim();if(!n)return;if(players.some(p=>p.name.toLowerCase()===n.toLowerCase()))return alert("Player already exists");players.push({id:crypto.randomUUID(),name:n,pvp_type:"Sword",tier:"B"});$("newName").value="";adminRender();render()};
$("adminPlayers").onchange=e=>{let i=e.target.dataset.player;if(i!==undefined){players[Number(i)][e.target.dataset.type]=e.target.value;render()}if(e.target.dataset.name!==undefined){let i=Number(e.target.dataset.name),n=e.target.value.trim();if(n){players[i].name=n;render()}}};
$("adminPlayers").onclick=e=>{let i=e.target.dataset.remove;if(i!==undefined&&confirm("Remove "+players[Number(i)].name+" from the tier list?")){let p=players.splice(Number(i),1)[0];if(p.id)deleted.push(p.id);adminRender();render()}};
db.channel("outlast-players").on("postgres_changes",{event:"*",schema:"public",table:"players"},()=>loadPlayers()).subscribe();
setInterval(()=>{$("liveText").textContent="LIVE • Updated "+new Date().toLocaleTimeString()},1000);
loadPlayers();
