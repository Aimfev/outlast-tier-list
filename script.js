const SUPABASE_URL="https://zlafujlphygriexovkhw.supabase.co";
const SUPABASE_KEY="sb_publishable_37Iz_G90JMHEFzDyWI1SRA_W6BDxl5S";
const DB=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);

let players=[];
let deleted=[];
let active="All";

const types=["Sword","UHC","Cart","Spear","Mace","Elytra Mace","Neth Pot","SMP"];

const ranks=[
"HT1",
"LT1",
"HT2",
"LT2",
"HT3",
"LT3",
"HT4",
"LT4",
"HT5",
"LT5",
"LT6"
];

const rankDescriptions={
"HT1":"The Elites",
"LT1":"The Elites",
"HT2":"Extremely skilled",
"LT2":"Extremely skilled",
"HT3":"The Sweats",
"LT3":"The Sweats",
"HT4":"Above Average",
"LT4":"Above Average",
"HT5":"Average",
"LT5":"Entry Level",
"LT6":"Needs a lot of practice"
};

function esc(x){
return String(x??"").replace(/[&<>"']/g,m=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#39;"
}[m]));
}

async function load(){

const r=await DB
.from("players")
.select("*")
.order("id",{ascending:true});

if(r.error){

$("rankingList").textContent=
"Database error: "+r.error.message;

return false;
}

players=r.data||[];

render();

return true;
}

function render(){

const q=$("search").value.toLowerCase();

let list=players.filter(p=>
String(p.name).toLowerCase().includes(q)
);

if(active!=="All"){

list=list.filter(p=>
p.pvp_type===active
);

}

list.sort((a,b)=>
ranks.indexOf(a.tier)-ranks.indexOf(b.tier)
);

$("count").textContent=
list.length+" players";

$("filters").innerHTML=
["All",...types].map(t=>
`<button data-cat="${t}" class="${active===t?"active":""}">${t}</button>`
).join("");

$("rankingList").innerHTML=
list.map((p,i)=>
`
<div class="rank">

<b>#${i+1}</b>

<div class="player">

<div class="avatar">
${esc(String(p.name)[0]||"?")}
</div>

<div>

<div class="name">
${esc(p.name)}
</div>

<div class="sub">
PvP Type: ${esc(p.pvp_type)} • Rank: ${esc(p.tier)}
</div>

</div>

</div>

<div class="tier">
${esc(p.tier)}
</div>

</div>
`
).join("")||"No players found.";

$("playerGrid").innerHTML=
list.map(p=>
`
<div class="profile card glass">

<h3>
${esc(p.name)}
</h3>

<div class="tiers">

<div class="mini">
PvP Type
<b>${esc(p.pvp_type)}</b>
</div>

<div class="mini">
Rank
<b>${esc(p.tier)}</b>
</div>

<div class="mini">
Level
<b>${esc(rankDescriptions[p.tier]||"Unranked")}</b>
</div>

</div>

</div>
`
).join("");
}

function admin(){

let html=
`<button id="saveChanges" class="saveButton">
💾 SAVE CHANGES
</button>`;

players.forEach((p,i)=>{

html+=
`
<div class="adminPlayer">

<b>${esc(p.name)}</b>

<input
class="adminInput"
value="${esc(p.name)}"
data-name="${i}"
>

<div class="adminGrid">

<select
data-i="${i}"
data-k="pvp_type"
>

${types.map(t=>
`
<option
value="${esc(t)}"
${p.pvp_type===t?"selected":""}
>
${esc(t)}
</option>
`
).join("")}

</select>

<select
data-i="${i}"
data-k="tier"
>

${ranks.map(t=>
`
<option
value="${esc(t)}"
${p.tier===t?"selected":""}
>
${esc(t)}
</option>
`
).join("")}

</select>

</div>

<div class="sub" style="margin-top:7px">
${esc(rankDescriptions[p.tier]||"Unranked")}
</div>

<button
class="danger"
data-del="${i}"
>
🗑 REMOVE
</button>

</div>
`;

});

$("adminPlayers").innerHTML=html;
}

async function save(){

const button=$("saveChanges");

if(!button)return;

button.disabled=true;
button.textContent="SAVING...";

try{

/* UPDATE EXISTING PLAYERS */

for(const p of players){

if(p.id===null||p.id===undefined){
continue;
}

const r=await DB
.from("players")
.update({
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
})
.eq("id",p.id);

if(r.error){

throw new Error(r.error.message);

}

}

/* INSERT NEW PLAYERS */

const newPlayers=players.filter(p=>
p.id===null||p.id===undefined
);

for(const p of newPlayers){

const r=await DB
.from("players")
.insert({
name:p.name,
pvp_type:p.pvp_type,
tier:p.tier
})
.select()
.single();

if(r.error){

throw new Error(r.error.message);

}

p.id=r.data.id;

}

/* DELETE PLAYERS */

if(deleted.length>0){

const r=await DB
.from("players")
.delete()
.in("id",deleted);

if(r.error){

throw new Error(r.error.message);

}

}

deleted=[];

await load();

admin();

const saved=$("saveChanges");

if(saved){

saved.textContent="✅ SAVED";
saved.disabled=false;

}

}catch(error){

console.error(error);

alert("Save error: "+error.message);

const failed=$("saveChanges");

if(failed){

failed.textContent="❌ SAVE FAILED";
failed.disabled=false;

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

$("loginError").textContent=
"Enter email and password.";

return;

}

$("loginError").textContent=
"Logging in...";

const r=await DB.auth.signInWithPassword({
email:email,
password:password
});

if(r.error){

$("loginError").textContent=
r.error.message;

return;

}

$("loginError").textContent="";

$("loginModal").classList.remove("show");

$("adminModal").classList.add("show");

admin();

};

$("loginPass").onkeydown=e=>{

if(e.key==="Enter"){

$("loginSubmit").click();

}

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

if(players.some(p=>
String(p.name).toLowerCase()===
name.toLowerCase()
)){

alert("Player already exists.");

return;

}

/* NEW PLAYER */

players.push({
name:name,
pvp_type:"Sword",
tier:"LT6"
});

$("newName").value="";

admin();

render();

};

$("adminPlayers").onchange=e=>{

const i=e.target.dataset.i;

if(i!==undefined){

players[Number(i)][e.target.dataset.k]=
e.target.value;

render();

admin();

}

};

$("adminPlayers").oninput=e=>{

const i=e.target.dataset.name;

if(i!==undefined){

players[Number(i)].name=
e.target.value;

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

$(x.dataset.go).scrollIntoView({
behavior:"smooth"
});

$("sideMenu").classList.remove("open");

};

});

setInterval(()=>{

$("liveText").textContent=
"LIVE • "+new Date().toLocaleTimeString();

},1000);

load();