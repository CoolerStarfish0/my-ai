// Axon Stickman Showdown — canvas-based 2D fighter
export function playStickman(showStage, setCleanup) {
  const weapons = {fists:{name:"Fists",reach:48,damage:9,speed:0.32,color:"#fff"},sword:{name:"Sword",reach:82,damage:13,speed:0.42,color:"#67e8f9"},staff:{name:"Staff",reach:105,damage:10,speed:0.35,color:"#facc15"},hammer:{name:"Hammer",reach:74,damage:19,speed:0.66,color:"#fb7185"}};
  let raf=0, running=false, over=false, last=0, playerWins=0, aiWins=0, round=1, weapon="sword", difficulty="medium", p, enemy, particles=[], keys=new Set(), buttons=[], resetTimeout=0;
  const cleanup=()=>{running=false;cancelAnimationFrame(raf);clearTimeout(resetTimeout);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);buttons.forEach(([el,fn])=>{el.removeEventListener("pointerdown",fn);});keys.clear();};
  setCleanup(cleanup);
  showStage("🥊 Stickman Showdown",`<p class="game-subtitle">Choose your weapon before fighting. First to win two rounds takes the match!</p><div class="stick-config"><label>Weapon <select id="stickWeapon"><option value="fists">🥊 Fists</option><option value="sword" selected>⚔️ Sword</option><option value="staff">🏑 Staff</option><option value="hammer">🔨 Hammer</option></select></label><label>AI difficulty <select id="stickDifficulty"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select></label><button class="axon-game-button" id="stickStart">Start fight</button></div><div class="stick-hud"><span id="stickPHealth">YOU: 100</span><strong id="stickScore">ROUND 1 · 0–0</strong><span id="stickEHealth">AXON: 100</span></div><div class="stick-bars"><div><i id="stickPBar"></i></div><div><i id="stickEBar"></i></div></div><div class="stick-arena"><canvas id="stickCanvas" width="800" height="420" aria-label="2D stickman fighting arena"></canvas></div><p class="game-result" id="stickMessage" role="status">Choose your weapon and press Start fight.</p><div class="stick-controls"><button data-stick="left">◀</button><button data-stick="right">▶</button><button data-stick="jump">⬆ Jump</button><button data-stick="punch">🥊 Punch</button><button data-stick="kick">🦵 Kick</button><button data-stick="special">⚡ Special</button></div><p class="game-muted">Keyboard: A/D move · W jump · R punch · K kick · L special · S block. On mobile, hold the on-screen buttons.</p>`);
  const el=id=>document.getElementById(id),canvas=el("stickCanvas"),ctx=canvas.getContext("2d"),floor=348;
  const make=(x,color,face)=>({x,y:floor,vx:0,vy:0,hp:100,color,face,ground:true,attack:0,attackType:"",cool:0,special:0,stun:0,block:false,rag:0,rot:0,aiTick:0});
  function initRound(){p=make(210,"#a78bfa",1);enemy=make(590,"#fb7185",-1);particles=[];over=false;running=true;last=0;el("stickMessage").textContent="FIGHT!";updateHud();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
  function updateHud(){el("stickPHealth").textContent="YOU: "+Math.ceil(p.hp);el("stickEHealth").textContent="AXON: "+Math.ceil(enemy.hp);el("stickPBar").style.width=p.hp+"%";el("stickEBar").style.width=enemy.hp+"%";el("stickScore").textContent="ROUND "+round+" · "+playerWins+"–"+aiWins;}
  function strike(a,b,type){if(a.cool>0||a.stun>0||over)return;const w=weapons[weapon],isSpecial=type==="special";if(isSpecial&&a.special>0)return;
    a.attack=0.26;a.attackType=type;a.cool=(type==="kick"?.48:isSpecial?1.1:w.speed);if(isSpecial)a.special=3.4;
    const reach=(type==="punch"?w.reach:type==="kick"?70:w.reach+32),damage=(type==="punch"?w.damage:type==="kick"?12:w.damage+11);
    if(Math.abs(a.x-b.x)<reach+20&&Math.abs(a.y-b.y)<82&&Math.sign(b.x-a.x)===a.face){
      const amount=b.block?Math.ceil(damage*.25):damage;b.hp=Math.max(0,b.hp-amount);b.vx+=a.face*(b.block?105:240+(isSpecial?180:0));b.vy-=b.block?30:140+(isSpecial?120:0);b.stun=b.block?.07:.25;b.rag=b.block?0:.4;b.rot=a.face*.3;
      for(let i=0;i<9;i++)particles.push({x:b.x,y:b.y-60,vx:(Math.random()-.5)*240,vy:(Math.random()-.5)*230,life:.35});
      updateHud();if(b.hp<=0)endRound(a===p);
    }
  }
  function endRound(win){if(over)return;over=true;running=false;win?playerWins++:aiWins++;updateHud();el("stickMessage").textContent=win?"YOU WIN THE ROUND! 🏆":"AXON WINS THE ROUND!";
    if(playerWins===2||aiWins===2){el("stickMessage").textContent=playerWins===2?"🏆 YOU WIN THE MATCH! Choose Start fight to play again.":"💀 AXON WINS THE MATCH! Choose Start fight to retry.";return;}
    resetTimeout=setTimeout(()=>{round++;initRound();},1500);
  }
  function physics(f,dt){f.cool=Math.max(0,f.cool-dt);f.attack=Math.max(0,f.attack-dt);f.special=Math.max(0,f.special-dt);f.stun=Math.max(0,f.stun-dt);f.rag=Math.max(0,f.rag-dt);f.vy+=900*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-7*dt);if(f.y>=floor){f.y=floor;f.vy=0;f.ground=true;}else f.ground=false;f.x=Math.max(35,Math.min(765,f.x));if(f.rag===0)f.rot*=Math.exp(-8*dt);}
  function controls(dt){if(p.stun>0)return;p.block=keys.has("block")&&p.ground;if(!p.block){if(keys.has("left"))p.vx=-230;if(keys.has("right"))p.vx=230;if(keys.has("jump")&&p.ground){p.vy=-410;p.ground=false;}if(keys.has("punch"))strike(p,enemy,"punch");else if(keys.has("kick"))strike(p,enemy,"kick");else if(keys.has("special"))strike(p,enemy,"special");}}
  function ai(dt){enemy.aiTick-=dt;if(enemy.stun>0)return;const dist=Math.abs(p.x-enemy.x),speed=difficulty==="hard"?215:difficulty==="medium"?165:105;
    enemy.face=p.x<enemy.x?-1:1;enemy.block=p.attack>0&&dist<100&&Math.random()<(difficulty==="hard"?.09:.025);
    if(dist>75)enemy.vx=enemy.face*speed;else if(dist<35)enemy.vx=-enemy.face*speed*.55;
    if(enemy.aiTick<=0){enemy.aiTick=difficulty==="hard"?.24:difficulty==="medium"?.42:.78;
      if(dist<weapons[weapon].reach+28&&!enemy.block)strike(enemy,p,Math.random()<.16?"special":Math.random()<.35?"kick":"punch");
      if(p.attack>0&&dist<105&&enemy.ground&&Math.random()<(difficulty==="hard"?.22:.06))enemy.vy=-370;
    }
  }
  function line(x1,y1,x2,y2,color,width=6){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawFighter(f,t){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot*(f.rag>0?1:.2));const c=f.color,walk=Math.sin(t*.013+f.x*.05)*8*(Math.abs(f.vx)>20?1:.12);
    line(0,-42,-12+walk,0,c);line(0,-42,12-walk,0,c);line(0,-95,0,-42,c,8);ctx.beginPath();ctx.arc(0,-112,17,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=6;ctx.stroke();
    line(0,-84,-f.face*19,-54,c);let handX=f.face*23,handY=-56;
    if(f.attack>0){handX=f.face*(f.attackType==="kick"?18:55);handY=f.attackType==="kick"?-54:-81;}
    line(0,-84,handX,handY,c);if(weapon!=="fists"){const w=weapons[weapon];line(handX,handY,handX+f.face*(w.reach*.6),handY-17,w.color,weapon==="hammer"?11:5);if(weapon==="hammer")line(handX+f.face*(w.reach*.6),handY-30,handX+f.face*(w.reach*.6),handY,w.color,16);}
    if(f.attackType==="kick"&&f.attack>0)line(0,-42,f.face*61,-42,c,7);
    if(f.block){ctx.strokeStyle="#93c5fd";ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.face*23,-74,27,-1.5,1.5);ctx.stroke();}
    ctx.restore();}
  function render(t){ctx.clearRect(0,0,800,420);const bg=ctx.createLinearGradient(0,0,0,420);bg.addColorStop(0,"#170e30");bg.addColorStop(1,"#070713");ctx.fillStyle=bg;ctx.fillRect(0,0,800,420);
    ctx.strokeStyle="#ffffff0b";ctx.lineWidth=1;for(let x=0;x<800;x+=50)line(x,0,x,420,"#ffffff09",1);for(let y=0;y<420;y+=50)line(0,y,800,y,"#ffffff09",1);
    ctx.fillStyle="#38265d";ctx.fillRect(0,floor,800,72);line(0,floor,800,floor,"#a78bfa",4);
    drawFighter(p,t);drawFighter(enemy,t);for(const q of particles){ctx.fillStyle="#fde68a";ctx.fillRect(q.x,q.y,5,5);}
  }
  function loop(t){if(!running)return;const dt=Math.min((t-(last||t))/1000,.033);last=t;controls(dt);ai(dt);physics(p,dt);physics(enemy,dt);if(Math.abs(p.x-enemy.x)<34){const d=p.x<enemy.x?-1:1;p.x+=d*1.4;enemy.x-=d*1.4;}particles=particles.filter(q=>(q.life-=dt)>0);for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;}render(t);if(running)raf=requestAnimationFrame(loop);}
  const map={KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",KeyW:"jump",ArrowUp:"jump",KeyR:"punch",KeyK:"kick",KeyL:"special",KeyS:"block"};
  function down(e){if(!document.getElementById("stickCanvas"))return;const key=map[e.code];if(key){e.preventDefault();keys.add(key);}}
  function up(e){const key=map[e.code];if(key)keys.delete(key);}
  function blur(){keys.clear();}
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
  document.querySelectorAll("[data-stick]").forEach(btn=>{const k=btn.dataset.stick;const start=e=>{e.preventDefault();keys.add(k);try{btn.setPointerCapture(e.pointerId);}catch{}};const stop=e=>{e.preventDefault();keys.delete(k);};btn.addEventListener("pointerdown",start);btn.addEventListener("pointerup",stop);btn.addEventListener("pointercancel",stop);buttons.push([btn,start]);});
  el("stickStart").addEventListener("click",()=>{weapon=el("stickWeapon").value;difficulty=el("stickDifficulty").value;playerWins=0;aiWins=0;round=1;keys.clear();initRound();});
  p=make(210,"#a78bfa",1);enemy=make(590,"#fb7185",-1);render(0);
}
