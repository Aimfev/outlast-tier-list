const URL="https://zlafujlphygriexovkhw.supabase.co";
const KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
const DB=window.supabase.createClient(URL,KEY);
const $=x=>document.getElementById(x);
let players=[];
let deleted=[];
let active="All";
const types=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];
const ranks=["S","A+","A","B+","B"];
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
async function load(){const r=await DB.from("players").select("*");if(r.error){$("rankingList").innerHTML="Database error: "+r.error.message;return}players=r.data||[];render()}
function render(){let q=$("search").value.toLowerCase();let a=players.filter(p=>p.name.toLowerCase().includes(q));if(active!="All")a=a.filter(p=>p.pvp_type==active);a.sort((x,y)=>ranks.indexOf(x.tier)-ranks.indexOf(y.tier));$("filters").innerHTML=["All",...types].map(x=>`<button data-cat="${x}" class="${active==x?"active":""}">${x}</button>`).join("");$("count").textContent=a.length+" players";$("rankingList").innerHTML=a.map((p,i)=>`<div class="rank"><b>#${i+1}</b><div class="player"><div class="avatar">${esc(p.name[0])}</div><div><div class="name">${esc(p.name)}</div><div class="sub">PvP Type: ${esc(p.pvp_type)} • Rank: ${esc(p.tier)}</div></div></div><div class="tier">${p.tier}</div></div>`).join("")||"No players found.";$("playerGrid").innerHTML=a.map(p=>`<div class="profile card glass"><h3>${esc(p.name)}</h3><div class="tiers"><div class="mini">PvP Type <b>${esc(p.pvp_type)}</b></div><div class="mini">Rank <b>${esc(p.tier)}</b></div></div></div>`).join("")}
function admin(){let h=`<button id="saveChanges" class="saveButton">💾 SAVE CHANGES</button>`;players.forEach((p,i)=>h+=`<div class="adminPlayer"><b>${esc(p.name)}</b><input class="adminInput" value="${esc(p.name)}" data-name="${i}"><div class="adminGrid"><select data-i="${i}" data-k="pvp_type">${types.map(x=>`<option ${p.pvp_type==x?"selected":""}>${x}</option>`).join("")}</select><select data-i="${i}" data-k="tier">${ranks.map(x=>`<option ${p.tier==x?"selected":""}>${x}</option>`).join("")}</select></div><button class="danger" data-del="${i}">🗑 REMOVE</button></div>`);$("adminPlayers").innerHTML=h}
async function save(){let b=$("saveChanges");b.textContent="SAVING...";let r=await DB.from("players").upsert(players.map(p=>({id:p.id,name:p.name,pvp_type:p.pvp_type,tier:p.tier})));if(r.error){alert(r.error.message);b.textContent="SAVE FAILED";return}if(deleted.length)await DB.from("players").delete().in("id",deleted);deleted=[];b.textContent="✅ SAVED";await load()}
$("menuBtn").onclick=()=>$("sideMenu").classList.toggle("open");
$("loginBtn").onclick=()=>{$("loginModal").classList.add("show");$("sideMenu").classList.remove("open")};
$("loginClose").onclick=()=>$("loginModal").classList.remove("show");
$("adminClose").onclick=()=>$("adminModal").classList.remove("show");
$("loginSubmit").onclick=async()=>{let e=$("loginEmail").value.trim(),p=$("loginPass").value;if(!e||!p){$("loginError").textContent="Enter email and password.";return}$("loginError").textContent="Logging in...";let r=await DB.auth.signInWithPassword({email:e,password:p});if(r.error){$("loginError").textContent=r.error.message;return}$("loginModal").classList.remove("show");$("adminModal").classList.add("show");admin()};
$("loginPass").onkeydown=e=>{if(e.key=="Enter")$("loginSubmit").click()};
$("search").oninput=render;
$("filters").onclick=e=>{if(e.target.dataset.cat){active=e.target.dataset.cat;render()}};
$("addPlayer").onclick=()=>{let n=$("newName").value.trim();if(!n)return;if(players.some(p=>p.name.toLowerCase()==n.toLowerCase()))return alert("Already exists");players.push({id:crypto.randomUUID(),name:n,pvp_type:"Sword",tier:"B"});$("newName").value="";admin();render()};
$("adminPlayers").onchange=e=>{let i=e.target.dataset.i;if(i!==undefined){players[+i][e.target.dataset.k]=e.target.value;render()}let n=e.target.dataset.name;if(n!==undefined){players[+n].name=e.target.value.trim();render()}};
$("adminPlayers").onclick=e=>{if(e.target.id=="saveChanges"){save();return}let i=e.target.dataset.del;if(i!==undefined){let p=players.splice(+i,1)[0];deleted.push(p.id);admin();render()}};
document.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>{$(x.dataset.go).scrollIntoView({behavior:"smooth"});$("sideMenu").classList.remove("open")});
DB.channel("players-live").on("postgres_changes",{event:"*",schema:"public",table:"players"},load).subscribe();
setInterval(()=>$("liveText").textContent="LIVE • "+new Date().toLocaleTimeString(),1000);
load();