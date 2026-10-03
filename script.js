const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
const DB=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let players=[];
let deleted=[];
let active="All";
const types=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];
const ranks=["S","A+","A","B+","B"];

function esc(x){
return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))
}

async function load(){
const r=await DB.from("players").select("*").order("id",{ascending:true});
if(r.error){
$("rankingList").textContent="Database error: "+r.error.message;
return false;
}
players=r.data||[];
render();
return true;
}

function render(){
let q=$("search").value.toLowerCase();
let list=players.filter(p=>String(p.name).toLowerCase().includes(q));
if(active!=="All")list=list.filter(p=>p.pvp_type===active);
list.sort((a,b)=>ranks.indexOf(a.tier)-ranks.indexOf(b.tier));
$("count").textContent=list.length+" players";
$("filters").innerHTML=["All",...types].map(t=>`<button data-cat="${t}" class="${active===t?"active":""}">${t}</button>`).join("");
$("rankingList").innerHTML=list.map((p,i)=>`<div class="rank"><b>#${i+1}</b><div class="player"><div class="avatar">${esc(String(p.name)[0])}</div><div><div class="name">${esc(p.name)}</div><div class="sub">PvP Type: ${esc(p.pvp_type)} • Rank: ${esc(p.tier)}</div></div></div><div class="tier">${esc(p.tier)}</div></div>`).join("")||"No players found.";
$("playerGrid").innerHTML=list.map(p=>`<div class="profile card glass"><h3>${esc(p.name)}</h3><div class="tiers"><div class="mini">PvP Type <b>${esc(p.pvp_type)}</b></div><div class="mini">Rank <b>${esc(p.tier)}</b></div></div></div>`).join("");
}

function admin(){
let html=`<button id="saveChanges" class="saveButton">💾 SAVE CHANGES</button>`;
players.forEach((p,i)=>{
html+=`<div class="adminPlayer"><b>${esc(p.name)}</b><input class="adminInput" value="${esc(p.name)}" data-name="${i}"><div class="adminGrid"><select data-i="${i}" data-k="pvp_type">${types.map(t=>`<option value="${esc(t)}" ${p.pvp_type===t?"selected":""}>${esc(t)}</option>`).join("")}</select><select data-i="${i}" data-k="tier">${ranks.map(t=>`<option value="${esc(t)}" ${p.tier===t?"selected":""}>${esc(t)}</option>`).join("")}</select></div><button class="danger" data-del="${i}">🗑 REMOVE</button></div>`;
});
$("adminPlayers").innerHTML=html;
}

async function save(){
const button=$("saveChanges");

if(!button)return;

button.textContent="SAVING...";
button.disabled=true;

try{
const existing=players.filter(p=>p.id!==null&&p.id!==undefined);
const newPlayers=players.filter(p=>p.id===null||p.id===undefined);

if(existing.length){
const r=await DB.from("players").upsert(
existing.map(p=>({
id:p.id,
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
})),
{onConflict:"id"}
);

if(r.error)throw new Error(r.error.message);
}

if(newPlayers.length){
const r=await DB.from("players").insert(
newPlayers.map(p=>({
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
}))
);

if(r.error)throw new Error(r.error.message);
}

if(deleted.length){
const r=await DB.from("players").delete().in("id",deleted);

if(r.error)throw new Error(r.error.message);
}

deleted=[];

await load();

admin();

button=$("saveChanges");

if(button){
button.textContent="✅ SAVED";
button.disabled=false;
}

setTimeout(()=>{
const b=$("saveChanges");
if(b){
b.textContent="💾 SAVE CHANGES";
b.disabled=false;
}
},1200);

}catch(error){
alert("Save error: "+error.message);

const b=$("saveChanges");

if(b){
b.textContent="❌ SAVE FAILED";
b.disabled=false;
}
}
}

$("menuBtn").onclick=()=>{
$("sideMenu").classList.toggle("open");
};

$("loginBtn").onclick=()=>{
$("loginModal").classList.add("show");
$("sideMenu").classList.remove("open");
};

$("loginClose").onclick=()=>{
$("loginModal").classList.remove("show");
};

$("adminClose").onclick=()=>{
$("adminModal").classList.remove("show");
};

$("loginSubmit").onclick=async()=>{
const email=$("loginEmail").value.trim();
const password=$("loginPass").value;

if(!email||!password){
$("loginError").textContent="Enter email and password.";
return;
}

$("loginError").textContent="Logging in...";

const r=await DB.auth.signInWithPassword({
email:email,
password:password
});

if(r.error){
$("loginError").textContent=r.error.message;
return;
}

$("loginError").textContent="";
$("loginModal").classList.remove("show");
$("adminModal").classList.add("show");
admin();
};

$("loginPass").onkeydown=e=>{
if(e.key==="Enter")$("loginSubmit").click();
};

$("search").oninput=render;

$("filters").onclick=e=>{
if(e.target.dataset.cat){
active=e.target.dataset.cat;
render();
}
};

$("addPlayer").onclick=()=>{
const name=$("newName").value.trim();

if(!name)return;

if(players.some(p=>String(p.name).toLowerCase()===name.toLowerCase())){
alert("Player already exists.");
return;
}

players.push({
id:null,
name:name,
pvp_type:"Sword",
tier:"B"
});

$("newName").value="";
admin();
render();
};

$("adminPlayers").onchange=e=>{
const i=e.target.dataset.i;

if(i!==undefined){
players[Number(i)][e.target.dataset.k]=e.target.value;
render();
admin();
}
};

$("adminPlayers").oninput=e=>{
const i=e.target.dataset.name;

if(i!==undefined){
players[Number(i)].name=e.target.value;
}
};

$("adminPlayers").onclick=e=>{
if(e.target.id==="saveChanges"){
save();
return;
}

const i=e.target.dataset.del;

if(i!==undefined){
const p=players.splice(Number(i),1)[0];

if(p.id!==null&&p.id!==undefined){
deleted.push(p.id);
}

admin();
render();
}
};

document.querySelectorAll("[data-go]").forEach(x=>{
x.onclick=()=>{
$(x.dataset.go).scrollIntoView({behavior:"smooth"});
$("sideMenu").classList.remove("open");
};
});

setInterval(()=>{
$("liveText").textContent="LIVE • "+new Date().toLocaleTimeString();
},1000);

load();