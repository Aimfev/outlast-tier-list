document.addEventListener("DOMContentLoaded",function(){
const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
let db=null;
let players=[];
let filteredPlayers=[];
let activeFilter="ALL";
let editingPlayers=[];
const pvpTypes=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];
const tiers=["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5","LT6"];
const tierDescriptions={HT1:"The Elites",LT1:"The Elites",HT2:"Extremely skilled",LT2:"Extremely skilled",HT3:"The Sweats",LT3:"The Sweats",HT4:"Above Average",LT4:"Above Average",HT5:"Average",LT5:"Entry Level",LT6:"Needs a lot of practice / below LT5"};
const $=id=>document.getElementById(id);

function escapeHTML(value){
return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function getMinecraftAvatar(name){
return "https://mc-heads.net/avatar/"+encodeURIComponent(String(name||"").trim())+"/64";
}

function showLoadError(){
if($("rankingList"))$("rankingList").innerHTML='<div class="empty">Unable to load players.</div>';
if($("playerGrid"))$("playerGrid").innerHTML='<div class="empty">Unable to load players.</div>';
if($("count"))$("count").textContent="Unavailable";
}

async function loadPlayers(){
if(!db)return;
try{
const result=await db.from("players").select("*").order("created_at",{ascending:true});
if(result.error)throw result.error;
players=Array.isArray(result.data)?result.data:[];
editingPlayers=JSON.parse(JSON.stringify(players));
renderAll();
}catch(error){
console.error("Supabase load error:",error);
showLoadError();
}
}

function sortPlayers(list){
return [...list].sort((a,b)=>{
let ai=tiers.indexOf(a.tier);
let bi=tiers.indexOf(b.tier);
if(ai===-1)ai=999;
if(bi===-1)bi=999;
if(ai!==bi)return ai-bi;
return String(a.name||"").localeCompare(String(b.name||""));
});
}

function applyFilters(){
const search=(($("search")&&$("search").value)||"").toLowerCase().trim();
filteredPlayers=sortPlayers(players).filter(p=>{
const typeMatch=activeFilter==="ALL"||p.pvp_type===activeFilter;
const searchMatch=!search||String(p.name||"").toLowerCase().includes(search);
return typeMatch&&searchMatch;
});
renderRankings();
renderPlayers();
}

function renderFilters(){
const wrap=$("filters");
if(!wrap)return;
wrap.innerHTML="";
["ALL",...pvpTypes].forEach(type=>{
const button=document.createElement("button");
button.className="filterButton"+(activeFilter===type?" active":"");
button.textContent=type==="ALL"?"All":type;
button.type="button";
button.onclick=()=>{
activeFilter=type;
renderFilters();
applyFilters();
};
wrap.appendChild(button);
});
}

function renderRankings(){
const list=$("rankingList");
if(!list)return;
if($("count")){
$("count").textContent=filteredPlayers.length+" player"+(filteredPlayers.length===1?"":"s");
}
if(!filteredPlayers.length){
list.innerHTML='<div class="empty">No players found.</div>';
return;
}
list.innerHTML=filteredPlayers.map((p,i)=>{
const avatar=getMinecraftAvatar(p.name);
const letter=escapeHTML(String(p.name||"?").charAt(0).toUpperCase());
return `<div class="rankRow"><div class="rankNumber">#${i+1}</div><div class="playerInfo"><div class="avatar"><img src="${avatar}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.textContent='${letter}'"></div><div class="playerText"><div class="playerName">${escapeHTML(p.name)}</div><div class="playerSub">${escapeHTML(p.pvp_type)} • ${escapeHTML(tierDescriptions[p.tier]||"")}</div></div></div><div class="tierBadge">${escapeHTML(p.tier)}</div></div>`;
}).join("");
}

function renderPlayers(){
const grid=$("playerGrid");
if(!grid)return;
if(!filteredPlayers.length){
grid.innerHTML='<div class="empty">No players found.</div>';
return;
}
grid.innerHTML=filteredPlayers.map(p=>{
const avatar=getMinecraftAvatar(p.name);
return `<div class="profileCard"><div class="profileTop"><div class="profileAvatar"><img src="${avatar}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'"></div><div><h3 class="profileName">${escapeHTML(p.name)}</h3><div class="profileType">${escapeHTML(p.pvp_type)}</div></div></div><div class="profileDetails"><div class="detail">Tier<strong>${escapeHTML(p.tier)}</strong></div><div class="detail">Level<strong>${escapeHTML(tierDescriptions[p.tier]||"")}</strong></div></div></div>`;
}).join("");
}

function renderAll(){
renderFilters();
applyFilters();
renderAdmin();
}

function renderAdmin(){
const box=$("adminPlayers");
if(!box)return;

if(!editingPlayers.length){
box.innerHTML='<div class="empty">No players yet.</div>';
return;
}

box.innerHTML=editingPlayers.map((p,i)=>`
<div class="adminPlayer">
<div class="adminPlayerName">${escapeHTML(p.name)}</div>
<div class="adminGrid">
<select class="adminType" data-index="${i}">
${pvpTypes.map(x=>`<option value="${escapeHTML(x)}" ${p.pvp_type===x?"selected":""}>${escapeHTML(x)}</option>`).join("")}
</select>
<select class="adminTier" data-index="${i}">
${tiers.map(x=>`<option value="${x}" ${p.tier===x?"selected":""}>${x}</option>`).join("")}
</select>
</div>
<div class="adminDescription">${escapeHTML(tierDescriptions[p.tier]||"")}</div>
<button type="button" class="removeButton" data-index="${i}">REMOVE</button>
</div>`).join("");

box.querySelectorAll(".adminType").forEach(el=>{
el.onchange=()=>{
const index=Number(el.dataset.index);
if(editingPlayers[index]){
editingPlayers[index].pvp_type=el.value;
renderAdmin();
}
};
});

box.querySelectorAll(".adminTier").forEach(el=>{
el.onchange=()=>{
const index=Number(el.dataset.index);
if(editingPlayers[index]){
editingPlayers[index].tier=el.value;
renderAdmin();
}
};
});

box.querySelectorAll(".removeButton").forEach(el=>{
el.onclick=()=>{
const index=Number(el.dataset.index);
editingPlayers.splice(index,1);
renderAdmin();
};
});
}

function addPlayer(){
const input=$("newName");
if(!input)return;

const name=input.value.trim();

if(!name){
alert("Enter a player name.");
return;
}

const exists=editingPlayers.some(p=>String(p.name||"").toLowerCase()===name.toLowerCase());

if(exists){
alert("That player already exists.");
return;
}

editingPlayers.push({
id:null,
name:name,
pvp_type:"Sword",
tier:"LT5",
created_at:new Date().toISOString()
});

input.value="";
renderAdmin();
}

async function saveChanges(){
if(!db)return;

const button=$("saveChanges");
if(!button)return;

button.disabled=true;
button.textContent="SAVING...";

try{
const originalById=new Map(players.filter(p=>p.id!=null).map(p=>[p.id,p]));

for(const p of editingPlayers){

if(p.id==null){

const result=await db.from("players").insert({
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
}).select().single();

if(result.error)throw result.error;

p.id=result.data.id;

}else{

const old=originalById.get(p.id);

if(!old||old.name!==p.name||old.pvp_type!==p.pvp_type||old.tier!==p.tier){

const result=await db.from("players").update({
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
}).eq("id",p.id);

if(result.error)throw result.error;

}
}
}

const currentIds=new Set(editingPlayers.filter(p=>p.id!=null).map(p=>p.id));

const deleted=players.filter(p=>p.id!=null&&!currentIds.has(p.id));

if(deleted.length){
const ids=deleted.map(p=>p.id);
const result=await db.from("players").delete().in("id",ids);
if(result.error)throw result.error;
}

await loadPlayers();

editingPlayers=JSON.parse(JSON.stringify(players));
renderAdmin();

alert("Changes saved successfully!");

}catch(error){
console.error("Save error:",error);
alert("Save failed: "+(error.message||String(error)));
}finally{
button.disabled=false;
button.textContent="💾 SAVE CHANGES";
}
}

async function login(){
if(!db)return;

const email=$("loginEmail").value.trim();
const password=$("loginPassword").value;

if(!email||!password){
$("loginError").textContent="Enter your email and password.";
return;
}

$("loginError").textContent="";
$("loginSubmit").disabled=true;
$("loginSubmit").textContent="LOGGING IN...";

try{
const result=await db.auth.signInWithPassword({
email:email,
password:password
});

if(result.error)throw result.error;

$("loginModal").classList.remove("show");
$("adminModal").classList.add("show");

editingPlayers=JSON.parse(JSON.stringify(players));
renderAdmin();

}catch(error){
console.error("Login error:",error);
$("loginError").textContent=error.message||"Login failed.";
}finally{
$("loginSubmit").disabled=false;
$("loginSubmit").textContent="LOGIN";
}
}

async function logout(){
if(db)await db.auth.signOut();
$("adminModal").classList.remove("show");
}

function closeMenu(){
$("sideMenu").classList.remove("open");
$("menuOverlay").classList.remove("show");
}

function openLogin(){
$("loginModal").classList.add("show");
}

function updateClock(){
const live=$("liveText");
if(live){
live.textContent=new Date().toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit",
second:"2-digit"
});
}
}

function setup(){
const menuBtn=$("menuBtn");
const menuOverlay=$("menuOverlay");
const loginBtn=$("loginBtn");
const loginClose=$("loginClose");
const adminClose=$("adminClose");
const loginSubmit=$("loginSubmit");
const logoutBtn=$("logoutBtn");
const addPlayerButton=$("addPlayer");
const saveButton=$("saveChanges");
const search=$("search");

if(menuBtn){
menuBtn.onclick=()=>{
$("sideMenu").classList.add("open");
$("menuOverlay").classList.add("show");
};
}

if(menuOverlay)menuOverlay.onclick=closeMenu;

document.querySelectorAll(".menuItem[data-go]").forEach(btn=>{
btn.onclick=()=>{
const target=$(btn.dataset.go);
closeMenu();
if(target)target.scrollIntoView({behavior:"smooth"});
};
});

if(loginBtn){
loginBtn.onclick=()=>{
closeMenu();
openLogin();
};
}

if(loginClose){
loginClose.onclick=()=>{
$("loginModal").classList.remove("show");
};
}

if(adminClose){
adminClose.onclick=()=>{
$("adminModal").classList.remove("show");
};
}

if(loginSubmit)loginSubmit.onclick=login;
if(logoutBtn)logoutBtn.onclick=logout;
if(addPlayerButton)addPlayerButton.onclick=addPlayer;
if(saveButton)saveButton.onclick=saveChanges;

if(search)search.addEventListener("input",applyFilters);

if($("loginPassword")){
$("loginPassword").addEventListener("keydown",e=>{
if(e.key==="Enter")login();
});
}

window.addEventListener("keydown",e=>{
if(e.key==="Escape"){
closeMenu();
$("loginModal").classList.remove("show");
$("adminModal").classList.remove("show");
}
});

updateClock();
setInterval(updateClock,1000);
}

if(!window.supabase){
console.error("Supabase library did not load.");
showLoadError();
setup();
return;
}

try{
db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
setup();
loadPlayers();
}catch(error){
console.error("Supabase initialization error:",error);
showLoadError();
setup();
}
});
