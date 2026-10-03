document.addEventListener("DOMContentLoaded",function(){
const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
let db=null;
let players=[];
let filteredPlayers=[];
let activeFilter="ALL";
let editingPlayers=[];
const pvpTypes=["Sword","UHC","Cart","Spear","Mace","Spear Mace","Elytra Mace","Neth Pot","SMP"];
const tiers=["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5","LT6","ST6"];
const tierDescriptions={HT1:"The Elites",LT1:"The Elites",HT2:"Extremely skilled",LT2:"Extremely skilled",HT3:"The Sweats",LT3:"The Sweats",HT4:"Above Average",LT4:"Above Average",HT5:"Average",LT5:"Entry Level",LT6:"Needs a lot of practice / below LT5",ST6:"Sub-Tier 6"};
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
const playersResult=await db.from("players").select("*").order("created_at",{ascending:true});
if(playersResult.error)throw playersResult.error;

const rankingsResult=await db.from("player_rankings").select("*").order("created_at",{ascending:true});
if(rankingsResult.error)throw rankingsResult.error;

const rankingRows=Array.isArray(rankingsResult.data)?rankingsResult.data:[];

players=(Array.isArray(playersResult.data)?playersResult.data:[]).map(player=>{
let rankings=rankingRows.filter(r=>String(r.player_id)===String(player.id));

if(!rankings.length&&player.pvp_type&&player.tier){
rankings=[{
id:null,
player_id:player.id,
pvp_type:player.pvp_type,
tier:player.tier,
created_at:player.created_at
}];
}

return{
...player,
rankings:rankings.map(r=>({
id:r.id,
player_id:r.player_id,
pvp_type:r.pvp_type,
tier:r.tier,
created_at:r.created_at
}))
};
});

editingPlayers=JSON.parse(JSON.stringify(players));
renderAll();

}catch(error){
console.error("Supabase load error:",error);
showLoadError();
}
}

function sortPlayers(list){
return[...list].sort((a,b)=>{
let ai=999;
let bi=999;
const ar=(a.rankings&&a.rankings.length)?a.rankings[0]:null;
const br=(b.rankings&&b.rankings.length)?b.rankings[0]:null;
if(ar)ai=tiers.indexOf(ar.tier)===-1?999:tiers.indexOf(ar.tier);
if(br)bi=tiers.indexOf(br.tier)===-1?999:tiers.indexOf(br.tier);
if(ai!==bi)return ai-bi;
return String(a.name||"").localeCompare(String(b.name||""));
});
}

function getAllRankingEntries(){
const entries=[];
players.forEach(player=>{
(player.rankings||[]).forEach(ranking=>{
entries.push({
player:player,
ranking:ranking
});
});
});
return entries;
}

function sortRankingEntries(list){
return[...list].sort((a,b)=>{
let ai=tiers.indexOf(a.ranking.tier);
let bi=tiers.indexOf(b.ranking.tier);
if(ai===-1)ai=999;
if(bi===-1)bi=999;
if(ai!==bi)return ai-bi;
return String(a.player.name||"").localeCompare(String(b.player.name||""));
});
}

function applyFilters(){
const search=(($("search")&&$("search").value)||"").toLowerCase().trim();

const entries=getAllRankingEntries();

filteredPlayers=sortRankingEntries(entries.filter(entry=>{
const player=entry.player;
const ranking=entry.ranking;
const typeMatch=activeFilter==="ALL"||ranking.pvp_type===activeFilter;
const searchMatch=!search||String(player.name||"").toLowerCase().includes(search);
return typeMatch&&searchMatch;
}));

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
$("count").textContent=filteredPlayers.length+" ranking"+(filteredPlayers.length===1?"":"s");
}

if(!filteredPlayers.length){
list.innerHTML='<div class="empty">No rankings found.</div>';
return;
}

list.innerHTML=filteredPlayers.map((entry,i)=>{
const player=entry.player;
const ranking=entry.ranking;
const avatar=getMinecraftAvatar(player.name);
const letter=escapeHTML(String(player.name||"?").charAt(0).toUpperCase());

return `<div class="rankRow">
<div class="rankNumber">#${i+1}</div>
<div class="playerInfo">
<div class="avatar">
<img src="${avatar}" alt="${escapeHTML(player.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.textContent='${letter}'">
</div>
<div class="playerText">
<div class="playerName">${escapeHTML(player.name)}</div>
<div class="playerSub">${escapeHTML(ranking.pvp_type)} • ${escapeHTML(tierDescriptions[ranking.tier]||"")}</div>
</div>
</div>
<div class="tierBadge">${escapeHTML(ranking.tier)}</div>
</div>`;
}).join("");
}

function renderPlayers(){
const grid=$("playerGrid");
if(!grid)return;

const search=(($("search")&&$("search").value)||"").toLowerCase().trim();

const visiblePlayers=players.filter(player=>{
const nameMatch=!search||String(player.name||"").toLowerCase().includes(search);
if(!nameMatch)return false;
if(activeFilter==="ALL")return true;
return(player.rankings||[]).some(r=>r.pvp_type===activeFilter);
});

if(!visiblePlayers.length){
grid.innerHTML='<div class="empty">No players found.</div>';
return;
}

grid.innerHTML=visiblePlayers.map(player=>{
const avatar=getMinecraftAvatar(player.name);

const rankings=(player.rankings||[]).filter(r=>{
return activeFilter==="ALL"||r.pvp_type===activeFilter;
});

return `<div class="profileCard">
<div class="profileTop">
<div class="profileAvatar">
<img src="${avatar}" alt="${escapeHTML(player.name)}" loading="lazy" onerror="this.style.display='none'">
</div>
<div>
<h3 class="profileName">${escapeHTML(player.name)}</h3>
<div class="profileType">${rankings.length} PvP ranking${rankings.length===1?"":"s"}</div>
</div>
</div>
<div class="profileDetails" style="grid-template-columns:1fr;">
${rankings.map(r=>`<div class="detail"><span>${escapeHTML(r.pvp_type)}</span><strong>${escapeHTML(r.tier)}</strong><small style="display:block;margin-top:4px;color:#789587;">${escapeHTML(tierDescriptions[r.tier]||"")}</small></div>`).join("")}
</div>
</div>`;
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

box.innerHTML=editingPlayers.map((p,i)=>{

const rankings=Array.isArray(p.rankings)?p.rankings:[];

return `<div class="adminPlayer">
<div class="adminPlayerName">${escapeHTML(p.name)}</div>

<div class="adminRankings" data-player="${i}">
${rankings.map((r,j)=>`
<div class="adminRankingRow" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 44px;gap:8px;margin-top:8px;">
<select class="adminType" data-player="${i}" data-ranking="${j}">
${pvpTypes.map(x=>`<option value="${escapeHTML(x)}" ${r.pvp_type===x?"selected":""}>${escapeHTML(x)}</option>`).join("")}
</select>

<select class="adminTier" data-player="${i}" data-ranking="${j}">
${tiers.map(x=>`<option value="${x}" ${r.tier===x?"selected":""}>${x}</option>`).join("")}
</select>

<button type="button" class="removeRankingButton" data-player="${i}" data-ranking="${j}" style="min-height:42px;border:1px solid rgba(255,100,100,.15);border-radius:11px;background:linear-gradient(135deg,rgba(180,55,55,.22),rgba(100,30,30,.08));color:#ffeaea;cursor:pointer;font-weight:bold;">×</button>
</div>
`).join("")}
</div>

<button type="button" class="addRankingButton" data-player="${i}" style="width:100%;min-height:40px;margin-top:8px;border:1px solid rgba(100,255,175,.15);border-radius:11px;background:linear-gradient(135deg,rgba(60,220,130,.18),rgba(30,130,75,.08));color:#baffd4;cursor:pointer;font-weight:bold;">＋ ADD ANOTHER</button>

<button type="button" class="removeButton" data-index="${i}">REMOVE PLAYER</button>
</div>`;
}).join("");

box.querySelectorAll(".adminType").forEach(el=>{
el.onchange=()=>{
const playerIndex=Number(el.dataset.player);
const rankingIndex=Number(el.dataset.ranking);

if(editingPlayers[playerIndex]&&editingPlayers[playerIndex].rankings[rankingIndex]){
editingPlayers[playerIndex].rankings[rankingIndex].pvp_type=el.value;
renderAdmin();
}
};
});

box.querySelectorAll(".adminTier").forEach(el=>{
el.onchange=()=>{
const playerIndex=Number(el.dataset.player);
const rankingIndex=Number(el.dataset.ranking);

if(editingPlayers[playerIndex]&&editingPlayers[playerIndex].rankings[rankingIndex]){
editingPlayers[playerIndex].rankings[rankingIndex].tier=el.value;
renderAdmin();
}
};
});

box.querySelectorAll(".addRankingButton").forEach(el=>{
el.onclick=()=>{
const playerIndex=Number(el.dataset.player);

if(editingPlayers[playerIndex]){
if(!Array.isArray(editingPlayers[playerIndex].rankings)){
editingPlayers[playerIndex].rankings=[];
}

editingPlayers[playerIndex].rankings.push({
id:null,
player_id:editingPlayers[playerIndex].id,
pvp_type:"Sword",
tier:"LT5",
created_at:new Date().toISOString()
});

renderAdmin();
}
};
});

box.querySelectorAll(".removeRankingButton").forEach(el=>{
el.onclick=()=>{
const playerIndex=Number(el.dataset.player);
const rankingIndex=Number(el.dataset.ranking);

if(editingPlayers[playerIndex]){
editingPlayers[playerIndex].rankings.splice(rankingIndex,1);
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
created_at:new Date().toISOString(),
rankings:[{
id:null,
player_id:null,
pvp_type:"Sword",
tier:"LT5",
created_at:new Date().toISOString()
}]
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

let playerId=p.id;

if(playerId==null){

const firstRanking=(p.rankings&&p.rankings.length)?p.rankings[0]:{
pvp_type:"Sword",
tier:"LT5"
};

const result=await db.from("players").insert({
name:p.name,
pvp_type:firstRanking.pvp_type,
tier:firstRanking.tier
}).select().single();

if(result.error)throw result.error;

playerId=result.data.id;
p.id=playerId;

if(!Array.isArray(p.rankings))p.rankings=[];

p.rankings.forEach(r=>r.player_id=playerId);

}else{

const old=originalById.get(playerId);

const firstRanking=(p.rankings&&p.rankings.length)?p.rankings[0]:{
pvp_type:"Sword",
tier:"LT5"
};

if(!old||old.name!==p.name||old.pvp_type!==firstRanking.pvp_type||old.tier!==firstRanking.tier){

const result=await db.from("players").update({
name:p.name,
pvp_type:firstRanking.pvp_type,
tier:firstRanking.tier
}).eq("id",playerId);

if(result.error)throw result.error;
}
}

const oldRankingsResult=await db.from("player_rankings").select("id").eq("player_id",playerId);

if(oldRankingsResult.error)throw oldRankingsResult.error;

const oldRankingIds=(oldRankingsResult.data||[]).map(r=>r.id);

if(oldRankingIds.length){

const deleteResult=await db.from("player_rankings").delete().in("id",oldRankingIds);

if(deleteResult.error)throw deleteResult.error;
}

const rankingsToSave=Array.isArray(p.rankings)?p.rankings:[];

if(rankingsToSave.length){

const rankingRows=rankingsToSave.map(r=>({
player_id:playerId,
pvp_type:r.pvp_type,
tier:r.tier
}));

const insertResult=await db.from("player_rankings").insert(rankingRows);

if(insertResult.error)throw insertResult.error;
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

if(target){
target.scrollIntoView({behavior:"smooth"});
}
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
