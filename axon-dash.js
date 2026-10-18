
export function playAxonDash(showStage,askAxon,setCleanup){
 let items=[],history=[],future=[],tool="spike",mode="edit",camera=0,runner=null,bot=null,raf=0,last=0,timer=0,generation=0,building=false,selected=null,worldColor="#131b33",pulse=0,shake=0,gravity=1500,speed=210;
 const stage=document.getElementById("gameStage");
 showStage("Axon Dash",'<div id="dashApp"><div id="dashTopbar"><p>Cube mode • Tap tiles to edit • Tap / Space to jump</p><button type="button" class="axon-game-button" data-dash="fullscreen">⛶ Full screen + landscape</button></div><p id="dashRotateHint" hidden>↻ Rotate your device sideways for the best experience.</p><div id="dashTools"></div><div id="dashInspector" style="display:none;padding:10px;margin:8px 0;border:1px solid #8c7cff;border-radius:10px;background:#171f39"></div><canvas id="dashCanvas" width="900" height="360" style="width:100%;height:auto;max-height:48vh;touch-action:none;border:1px solid #8c7cff;border-radius:12px"></canvas><div id="dashActions"></div><div id="dashMobileControls" aria-label="Mobile gameplay controls" style="display:none"><button type="button" class="axon-game-button" data-dash="jump" aria-label="Jump">⬆ JUMP</button></div><p>Ask Axon to build a level:</p><input id="dashPrompt" maxlength="200" placeholder="A fun space level with spikes" style="padding:10px;max-width:520px;width:60%"><button class="axon-game-button" data-dash="generate">Watch Axon build</button><button class="axon-game-button" data-dash="stop">Stop</button><p id="dashStatus" role="status">Editor ready.</p></div>');
 const app=stage.querySelector("#dashApp"),canvas=app.querySelector("canvas"),ctx=canvas.getContext("2d");
 const fullscreenStyle=document.createElement("style");
 fullscreenStyle.textContent=`
 #dashApp{box-sizing:border-box;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none} #dashApp input{user-select:text;-webkit-user-select:text} #dashCanvas{touch-action:none;user-select:none;-webkit-user-select:none} #dashMobileControls{justify-content:center;margin:8px 0;touch-action:none} #dashMobileControls button{min-width:150px;min-height:58px;font-size:20px;touch-action:none;user-select:none;-webkit-user-select:none}
 #dashTopbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 #dashApp:fullscreen,#dashApp.dash-fullscreen-fallback{position:fixed;inset:0;z-index:99999;box-sizing:border-box;width:100vw;height:100dvh;max-width:none;margin:0;padding:12px 18px;overflow:auto;background:#0c1224;color:#fff}
 #dashApp:fullscreen #dashCanvas,#dashApp.dash-fullscreen-fallback #dashCanvas{display:block;width:100%;height:calc(100dvh - 230px);max-height:none;min-height:180px;object-fit:contain}
 #dashApp:fullscreen #dashTools,#dashApp:fullscreen #dashActions,#dashApp.dash-fullscreen-fallback #dashTools,#dashApp.dash-fullscreen-fallback #dashActions{display:flex;flex-wrap:wrap;gap:4px}
 #dashApp:fullscreen button,#dashApp.dash-fullscreen-fallback button{min-height:40px}
 #dashApp:fullscreen #dashRotateHint,#dashApp.dash-fullscreen-fallback #dashRotateHint{font-size:13px;opacity:.85}
 @media(orientation:landscape) and (max-height:600px){#dashApp:fullscreen,#dashApp.dash-fullscreen-fallback{padding:5px 12px}#dashApp:fullscreen #dashTopbar p,#dashApp.dash-fullscreen-fallback #dashTopbar p{margin:2px 0}#dashApp:fullscreen #dashCanvas,#dashApp.dash-fullscreen-fallback #dashCanvas{height:calc(100dvh - 145px)}#dashApp:fullscreen #dashAppPrompt,#dashApp.dash-fullscreen-fallback #dashPrompt{max-width:35vw}}
 @media(orientation:portrait) and (max-width:800px){#dashRotateHint:not([hidden]){display:block}}
 `;
 app.appendChild(fullscreenStyle);
 const rotateHint=app.querySelector("#dashRotateHint");
 function isFullscreen(){return document.fullscreenElement===app||app.classList.contains("dash-fullscreen-fallback");}
 async function toggleFullscreen(){
  if(isFullscreen()){
   if(document.fullscreenElement===app){try{await document.exitFullscreen();}catch{}}
   app.classList.remove("dash-fullscreen-fallback");
   try{screen.orientation?.unlock?.();}catch{}
   const b=app.querySelector('[data-dash="fullscreen"]');if(b)b.textContent="⛶ Full screen + landscape";
   return;
  }
  try{
   if(app.requestFullscreen)await app.requestFullscreen();
   else app.classList.add("dash-fullscreen-fallback");
  }catch{app.classList.add("dash-fullscreen-fallback");}
  try{if(screen.orientation?.lock)await screen.orientation.lock("landscape");}catch{}
  const b=app.querySelector('[data-dash="fullscreen"]');if(b)b.textContent="✕ Exit full screen";
  if(rotateHint)rotateHint.hidden=!(window.matchMedia("(orientation: portrait)").matches);
  setTimeout(()=>{if(rotateHint)rotateHint.hidden=!(isFullscreen()&&window.matchMedia("(orientation: portrait)").matches);},250);
 }
 function syncFullscreen(){if(!isFullscreen()){app.classList.remove("dash-fullscreen-fallback");const b=app.querySelector('[data-dash="fullscreen"]');if(b)b.textContent="⛶ Full screen + landscape";}else{const b=app.querySelector('[data-dash="fullscreen"]');if(b)b.textContent="✕ Exit full screen";}}
 document.addEventListener("fullscreenchange",syncFullscreen);
 window.addEventListener("orientationchange",()=>{if(rotateHint)rotateHint.hidden=!(isFullscreen()&&window.matchMedia("(orientation: portrait)").matches);});
 const btn=(s,a,v="")=>'<button class="axon-game-button" data-dash="'+a+'" data-value="'+v+'" style="margin:3px">'+s+'</button>';
 app.querySelector("#dashTools").innerHTML=["select","spike","block","pad","orb","deco","saw","trigger","erase"].map(t=>btn(({select:"Select",spike:"Spike",block:"Block",pad:"Jump pad",orb:"Orb",deco:"Decoration",saw:"Saw",trigger:"Trigger",erase:"Erase"})[t],"tool",t)).join("")+btn("Undo","undo")+btn("Redo","redo");
 app.querySelector("#dashActions").innerHTML=btn("↶ Rotate 15°","rotate",-15)+btn("↻ Rotate 15°","rotate",15)+btn("Rotate 90°","rotate",90)+btn("Duplicate","duplicate")+btn("Delete selected","deleteSelected")+btn("← Scroll","scroll",-300)+btn("Scroll →","scroll",300)+btn("Edit","edit")+btn("Playtest","test")+btn("Race Axon","race")+btn("Save","save")+btn("Load","load")+btn("Clear","clear");
 const status=s=>{const e=app.querySelector("#dashStatus");if(e)e.textContent=s;};
 const len=()=>Math.max(1200,...items.map(o=>o.x+240));
 const valid=o=>o&&["spike","block","pad","orb","deco","saw","trigger"].includes(o.type)&&Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.y))&&o.x>=180&&o.x<=12000&&o.y>=0&&o.y<=8;
 const normalize=a=>Array.isArray(a)?a.filter(valid).slice(0,300).map(o=>({type:o.type,x:Math.round(Number(o.x)/30)*30,y:Math.max(0,Math.min(8,Math.round(Number(o.y)))),rotation:Number.isFinite(Number(o.rotation))?Number(o.rotation):0,variant:o.variant||"star",config:o.type==="trigger"?{effect:o.config?.effect||"color",value:o.config?.value||"#5d7cff",duration:Math.max(0.1,Math.min(10,Number(o.config?.duration)||1)),target:o.config?.target||"level"}:undefined})):[];
 const snap=()=>{history.push(JSON.stringify(items));if(history.length>60)history.shift();future=[];};
 const selectedItem=()=>items.find(o=>o===selected)||null;
 function inspector(){const panel=app.querySelector("#dashInspector"),o=selectedItem();if(!panel)return;if(!o||mode!=="edit"){panel.style.display="none";panel.innerHTML="";return;}panel.style.display="block";if(o.type==="trigger"){panel.innerHTML='<b>⚡ Trigger settings</b> &nbsp; X '+o.x+' <label>Effect <select id="dashTriggerEffect"><option value="color">Background color</option><option value="speed">Speed multiplier</option><option value="gravity">Gravity multiplier</option><option value="pulse">Pulse flash</option><option value="shake">Screen shake</option></select></label> <label>Value <input id="dashTriggerValue" value="'+String(o.config?.value??"#5d7cff").replace(/"/g,"&quot;")+'" style="width:100px"></label> <label>Duration (s) <input id="dashTriggerDuration" type="number" min="0.1" max="10" step="0.1" value="'+(o.config?.duration||1)+'" style="width:70px"></label> <button class="axon-game-button" data-dash="applyTrigger">Apply</button>';panel.querySelector("#dashTriggerEffect").value=o.config?.effect||"color";}else{panel.innerHTML='<b>Selected: '+o.type+'</b> &nbsp; Rotation: '+Math.round(o.rotation||0)+'° <button class="axon-game-button" data-dash="rotate" data-value="-15">↶ 15°</button><button class="axon-game-button" data-dash="rotate" data-value="15">↻ 15°</button><button class="axon-game-button" data-dash="rotate" data-value="90">90°</button><button class="axon-game-button" data-dash="duplicate">Duplicate</button><button class="axon-game-button" data-dash="deleteSelected">Delete</button>';} }
 const save=()=>{try{localStorage.setItem("axon_dash_v1",JSON.stringify(items));}catch{}};
 function draw(){
  ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-1.5);}ctx.fillStyle=worldColor;ctx.fillRect(0,0,900,360);if(pulse>0){ctx.fillStyle="rgba(255,255,255,"+(Math.min(.22,pulse/100)) +")";ctx.fillRect(0,0,900,360);pulse=Math.max(0,pulse-2);}ctx.fillStyle="#263351";
  for(let x=-camera%30;x<900;x+=30)ctx.fillRect(x,0,1,360);
  for(let y=0;y<360;y+=30)ctx.fillRect(0,y,900,1);
  ctx.fillStyle="#50648c";ctx.fillRect(0,300,900,4);
  for(const o of items){const x=o.x-camera,y=300-(o.y+1)*30;if(x<-50||x>950)continue;ctx.save();ctx.translate(x+15,y+15);ctx.rotate((o.rotation||0)*Math.PI/180);if(o.type==="spike"){ctx.fillStyle="#ff638e";ctx.beginPath();ctx.moveTo(-15,15);ctx.lineTo(0,-15);ctx.lineTo(15,15);ctx.closePath();ctx.fill();ctx.strokeStyle="#ffd1df";ctx.lineWidth=1.5;ctx.stroke();}if(o.type==="block"){ctx.fillStyle="#9a86ff";ctx.fillRect(-14,-14,28,28);ctx.strokeStyle="#d8d0ff";ctx.strokeRect(-14,-14,28,28);}if(o.type==="pad"){ctx.fillStyle="#ffe26d";ctx.fillRect(-13,7,26,8);ctx.fillStyle="#fff5bf";ctx.fillRect(-10,4,20,3);}if(o.type==="orb"){ctx.strokeStyle="#ffe26d";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#fff5bf";ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();}if(o.type==="deco"){ctx.strokeStyle="#5ce6ff";ctx.fillStyle="#5ce6ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(-7,-10);ctx.lineTo(0,4);ctx.lineTo(8,-13);ctx.lineTo(13,10);ctx.stroke();ctx.globalAlpha=.35;ctx.fillRect(-13,-13,26,26);}if(o.type==="saw"){ctx.fillStyle="#ffb35c";ctx.strokeStyle="#ffe0b5";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?10:15;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#452b4a";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();}if(o.type==="trigger"){ctx.strokeStyle="#57ffbf";ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.strokeRect(-13,-13,26,26);ctx.setLineDash([]);ctx.fillStyle="#57ffbf";ctx.font="bold 17px Arial";ctx.textAlign="center";ctx.fillText("T",0,6);}ctx.restore();if(o===selected&&mode==="edit"){ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.strokeRect(x-17,y-17,34,34);ctx.setLineDash([]);ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(x+20,y-20,6,0,Math.PI*2);ctx.fill();ctx.fillStyle="#131b33";ctx.font="bold 9px Arial";ctx.fillText("↻",x+16,y-17);}}

  ctx.fillStyle="#6df5b7";ctx.fillRect(len()-camera,0,4,300);
  if(mode!=="edit")for(const [r,c] of [[bot,"#b48aff"],[runner,"#67edff"]]){if(r&&r.alive){ctx.fillStyle=c;ctx.fillRect(r.x-camera,r.y,24,24);}}
  ctx.fillStyle="white";ctx.font="14px Arial";ctx.fillText("Level: "+Math.round(len()/30)+" tiles",12,20);
  if(mode==="race")ctx.fillText("You: "+Math.floor(runner.x/len()*100)+"% | Axon: "+Math.floor(bot.x/len()*100)+"%",12,40);ctx.restore();
 }
 const makeRunner=()=>({x:60,y:276,vy:0,alive:true,won:false,used:new Set()});
 function stop(){cancelAnimationFrame(raf);clearInterval(timer);generation++;building=false;}
 function jump(r){if(!r||!r.alive)return;if(r.y>=275)r.vy=-570;else for(let k=0;k<items.length;k++){const o=items[k];if(o.type==="orb"&&!r.used.has(k)&&Math.abs(o.x+15-r.x-12)<36&&Math.abs(300-(o.y+1)*30+15-r.y-12)<40){r.vy=-610;r.used.add(k);break;}}}
 function step(r,dt,ai){
  if(!r||!r.alive||r.won)return;
  if(ai&&r.y>=275&&items.some(o=>["spike","block","saw"].includes(o.type)&&o.y===0&&o.x>r.x+30&&o.x<r.x+100))jump(r);
  if(!ai){for(const t of items.filter(o=>o.type==="trigger"&&!r.used.has(items.indexOf(o))&&o.x<=r.x+8)){const k=items.indexOf(t);r.used.add(k);const c=t.config||{};if(c.effect==="color")worldColor=/^#[0-9a-f]{6}$/i.test(c.value)?c.value:"#5d7cff";if(c.effect==="speed")speed=Math.max(80,Math.min(400,210*(Number(c.value)||1)));if(c.effect==="gravity")gravity=Math.max(500,Math.min(2500,1500*(Number(c.value)||1)));if(c.effect==="pulse")pulse=100;if(c.effect==="shake")shake=18;}}
  const old=r.y;r.vy+=(gravity||1500)*dt;r.y+=r.vy*dt;r.x+=(speed||210)*dt;
  if(r.y>=276){r.y=276;r.vy=0;}
  for(let k=0;k<items.length;k++){const o=items[k],x=o.x,y=300-(o.y+1)*30;
   if(r.x+21<=x||r.x+3>=x+30)continue;
   if(o.type==="spike"&&r.y+22>y+9&&r.y<y+30)r.alive=false;
   if((o.type==="saw"||o.type==="block")&&r.y+22>y&&r.y+2<y+30){if(o.type==="block"&&old+24<=y+5&&r.vy>=0){r.y=y-24;r.vy=0;}else r.alive=false;}
   if(o.type==="pad"&&r.y+24>=y+20&&r.y+24<=y+32&&!r.used.has(k)){r.vy=-680;r.used.add(k);}
  }
  if(r.x>=len())r.won=true;
 }
 function frame(t){
  if(!last)last=t;let dt=Math.min(.05,(t-last)/1000);last=t;
  while(dt>0){const d=Math.min(dt,1/120);step(runner,d,false);if(mode==="race")step(bot,d,true);dt-=d;}
  camera=Math.max(0,runner.x-180);draw();
  if(runner.won){status("You finished!");return;}
  if(mode==="race"&&bot.won){status("Axon finished first!");return;}
  if(!runner.alive&&(mode!=="race"||!bot.alive)){status("Crash! Playtest or race again.");return;}
  raf=requestAnimationFrame(frame);
 }
 function begin(m){stop();mode=m;camera=0;worldColor="#131b33";speed=210;gravity=1500;pulse=0;shake=0;selected=null;inspector();runner=makeRunner();bot=m==="race"?makeRunner():null;last=0;const mobileControls=app.querySelector("#dashMobileControls");if(mobileControls)mobileControls.style.display=m==="edit"?"none":"flex";status(m==="edit"?"Editing":m==="race"?"Racing! Tap JUMP or the playfield.":"Playtest! Tap JUMP or the playfield.");draw();if(m!=="edit")raf=requestAnimationFrame(frame);}
 function fallback(s){const hard=/hard|extreme|insane/i.test(s),easy=/easy|beginner/i.test(s),count=hard?20:easy?8:13,arr=[];for(let i=0;i<count;i++)arr.push({type:i%5===4?"pad":"spike",x:330+i*(hard?165:easy?300:240),y:0});return arr;}
 async function generate(){
  if(building)return;stop();mode="edit";building=true;const id=++generation,request=app.querySelector("#dashPrompt").value.trim()||"A fun cube level";
  status("Axon is designing the level…");
  const system="Return ONLY JSON array of level objects {type,x,y}. Allowed types spike,block,pad,orb. x must be multiples of 30 between 300 and 6000. y is integer 0 to 8 counting upward from ground. Ground objects have y=0. Generate 10 to 30 objects spaced fairly. Avoid impossible walls and overlaps. No markdown.";
  const raw=await askAxon(system,"Build a playable auto-running cube level with speed 210 px/s, jump velocity -570, gravity 1500, tile size 30. Request: "+request,"");
  if(id!==generation)return;
  let parsed;try{const s=String(raw).trim();parsed=JSON.parse(s.startsWith("[")?s:s.slice(s.indexOf("["),s.lastIndexOf("]")+1));}catch{}
  let list=normalize(parsed);if(list.length<5)list=fallback(request);
  list.sort((a,b)=>a.x-b.x);snap();items=[];camera=0;draw();let i=0;status("Watch Axon place "+list.length+" objects…");
  timer=setInterval(()=>{if(id!==generation){clearInterval(timer);return;}if(i>=list.length){clearInterval(timer);building=false;save();status("Build complete! Playtest it first; AI layouts may need edits.");return;}items.push(list[i++]);camera=Math.max(0,items[items.length-1].x-550);draw();},140);
 }
 function click(e){
  if(mode!=="edit"){jump(runner);return;}if(building)return;
  const b=canvas.getBoundingClientRect(),px=(e.clientX-b.left)*900/b.width+camera,py=(e.clientY-b.top)*360/b.height,x=Math.floor(px/30)*30,y=Math.floor((300-py)/30);
  if(tool==="select"){const hit=[...items].reverse().find(o=>Math.abs(o.x+15-px)<19&&Math.abs(300-(o.y+1)*30+15-py)<19);selected=hit||null;inspector();draw();return;}
  if(x<180||x>12000||y<0||y>8)return;snap();const existing=items.findIndex(o=>o.x===x&&o.y===y&&o.type!=="deco");if(tool==="erase"){if(existing>=0)items.splice(existing,1);selected=null;}else{const obj={type:tool,x,y,rotation:0};if(tool==="trigger")obj.config={effect:"color",value:"#5d7cff",duration:1,target:"level"};if(existing>=0&&tool!=="deco")items.splice(existing,1);items.push(obj);selected=obj;}save();inspector();draw();
 }
 function buttons(e){
  const b=e.target.closest("[data-dash]");if(!b||!app.contains(b))return;const a=b.dataset.dash;
  if(a==="fullscreen"){toggleFullscreen();}
  else if(a==="jump"){if(mode!=="edit")jump(runner);}
  else if(a==="tool"){tool=b.dataset.value;status("Selected "+tool+(tool==="trigger"?" — place one, select it, then configure the effect.":""));if(tool!=="select")selected=null;inspector();}
  else if(a==="scroll"){camera=Math.max(0,Math.min(11500,camera+Number(b.dataset.value)));draw();}
  else if(["edit","test","race"].includes(a))begin(a);
  else if(a==="generate")generate();
  else if(a==="stop"){stop();status("Stopped.");}
  else if(a==="undo"&&history.length){future.push(JSON.stringify(items));items=JSON.parse(history.pop());save();draw();}
  else if(a==="redo"&&future.length){history.push(JSON.stringify(items));items=JSON.parse(future.pop());save();draw();}
  else if(a==="save"){save();status("Saved in browser.");}
  else if(a==="load"){try{items=normalize(JSON.parse(localStorage.getItem("axon_dash_v1")||"[]"));draw();status("Loaded.");}catch{status("Invalid save.");}}
  else if(a==="clear"&&confirm("Clear the level?")){stop();mode="edit";snap();items=[];selected=null;camera=0;worldColor="#131b33";speed=210;gravity=1500;save();inspector();draw();}
 }
 function key(e){if(!app.isConnected)return;if((e.code==="Space"||e.code==="ArrowUp")&&mode!=="edit"&&!e.repeat){e.preventDefault();jump(runner);}if(mode==="edit"&&selected&&["ArrowLeft","ArrowRight"].includes(e.code)){e.preventDefault();selected.rotation=((selected.rotation||0)+(e.code==="ArrowRight"?15:-15)+360)%360;inspector();save();draw();}}
 function cleanup(){stop();if(document.fullscreenElement===app)document.exitFullscreen().catch(()=>{});app.classList.remove("dash-fullscreen-fallback");try{screen.orientation?.unlock?.();}catch{}document.removeEventListener("fullscreenchange",syncFullscreen);stage.removeEventListener("click",buttons);canvas.removeEventListener("pointerdown",click);document.removeEventListener("keydown",key);window.removeEventListener("orientationchange",()=>{});}
 stage.addEventListener("click",buttons);canvas.addEventListener("pointerdown",click);document.addEventListener("keydown",key);setCleanup(cleanup);inspector();draw();
}
