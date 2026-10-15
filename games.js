import { getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const BACKEND_URL = "https://5158-ai-backendpriv.vercel.app";
const $ = (id) => document.getElementById(id);
const hub = $("gamesHub");
const stage = $("gameStage");
const cards = $("gamesGrid");
let gameCleanup = () => {};
let chessModulePromise = null;

const games = [
  {id:"tictactoe", icon:"❌⭕", title:"Tic-Tac-Toe", category:"Strategy", desc:"Outsmart Axon in a classic 3×3 showdown."},
  {id:"connect4", icon:"🔴", title:"Connect Four", category:"Strategy", desc:"Get four in a row before Axon does."},
  {id:"chess", icon:"♟️", title:"Chess", category:"Strategy", desc:"Play a full chess game against an AI opponent."},
  {id:"trivia", icon:"🧠", title:"Trivia Showdown", category:"Brain", desc:"Test your knowledge across a mix of topics."},
  {id:"riddle", icon:"🧩", title:"Riddle Master", category:"Brain", desc:"Crack the riddles. Hints are available."},
  {id:"word", icon:"🔤", title:"Word Guess", category:"Brain", desc:"Find the hidden five-letter word in six tries."},
  {id:"snake", icon:"🐍", title:"Snake", category:"Arcade", desc:"Eat, grow, and don't run into yourself."},
  {id:"shooter", icon:"🚀", title:"Space Shooter", category:"Arcade", desc:"Pilot your ship and blast the incoming targets."},
  {id:"adventure", icon:"🐉", title:"AI Adventure", category:"Adventure", desc:"Choose your path through a changing story."},
  {id:"mystery", icon:"🕵️", title:"Mystery Detective", category:"Adventure", desc:"Inspect clues and solve the case."}
];

function safeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function button(label, action, cls="") {
  return `<button type="button" class="axon-game-button ${cls}" data-action="${action}">${label}</button>`;
}
function showStage(title, content) {
  stage.innerHTML = `<div class="game-stage-heading"><button type="button" class="axon-game-button game-back" data-action="back">← All games</button><div><span class="games-eyebrow">AXON ARCADE</span><h2>${title}</h2></div></div><div class="game-play-area">${content}</div>`;
  stage.classList.remove("hidden");
  cards.classList.add("hidden");
}
function showHub() {
  gameCleanup();
  gameCleanup = () => {};
  stage.innerHTML = "";
  stage.classList.add("hidden");
  cards.classList.remove("hidden");
  hub.classList.remove("hidden");
  document.body.classList.add("games-open");
}
function closeHub() {
  gameCleanup();
  gameCleanup = () => {};
  stage.innerHTML = "";
  stage.classList.add("hidden");
  cards.classList.remove("hidden");
  hub.classList.add("hidden");
  document.body.classList.remove("games-open");
}
$("gamesButton")?.addEventListener("click", showHub);
$("gamesCloseButton")?.addEventListener("click", closeHub);
$("gamesHubBackdrop")?.addEventListener("click", closeHub);
document.addEventListener("keydown", e => { if(e.key === "Escape" && hub && !hub.classList.contains("hidden")) closeHub(); });
cards?.addEventListener("click", e => {
  const card = e.target.closest("[data-game]");
  if (card) launchGame(card.dataset.game);
});
stage?.addEventListener("click", e => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const action = b.dataset.action;
  if (action === "back") { gameCleanup(); gameCleanup=()=>{}; stage.classList.add("hidden"); cards.classList.remove("hidden"); return; }
  const handler = stageHandlers[action];
  if (handler) handler(b, e);
});
stage?.addEventListener("submit", e => {
  const form = e.target.closest("[data-game-form]");
  if (!form) return;
  e.preventDefault();
  const handler = stageHandlers[form.dataset.gameForm];
  if (handler) handler(form);
});

const stageHandlers = {};
function launchGame(id) {
  gameCleanup();
  gameCleanup = () => {};
  const game = games.find(g => g.id === id);
  if (!game) return;
  ({tictactoe:playTicTacToe, connect4:playConnect4, chess:playChess, trivia:playTrivia, riddle:playRiddle, word:playWord, snake:playSnake, shooter:playShooter, adventure:playAdventure, mystery:playMystery})[id]?.();
}
function resultBox(text, good=false) { return `<p class="game-result ${good?"is-good":""}" role="status">${text}</p>`; }

function playTicTacToe() {
  let board = Array(9).fill(""), over=false, score=0;
  showStage("Tic-Tac-Toe", `<p class="game-subtitle">You're <b>X</b>. Axon is <b>O</b>.</p><div class="ttt-board">${board.map((_,i)=>`<button class="ttt-cell" data-action="ttt-cell" data-index="${i}" aria-label="Cell ${i+1}"></button>`).join("")}</div><div id="tttStatus" class="game-result">Your move.</div>${button("Restart","ttt-restart","secondary")}`);
  function win(b,p){return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line=>line.every(i=>b[i]===p));}
  function paint(msg){stage.querySelectorAll(".ttt-cell").forEach((el,i)=>{el.textContent=board[i];el.disabled=!!board[i]||over;el.classList.toggle("is-x",board[i]==="X");el.classList.toggle("is-o",board[i]==="O");});$("tttStatus").textContent=msg;}
  stageHandlers["ttt-cell"] = b => {
    const i=Number(b.dataset.index); if(over||board[i])return; board[i]="X";
    if(win(board,"X")){over=true;paint("You beat Axon! 🏆");return;}
    if(board.every(Boolean)){over=true;paint("Draw! Rematch?");return;}
    // Minimax: Axon never misses a winning or blocking move.
    function minimax(b, turn){if(win(b,"O"))return 10;if(win(b,"X"))return -10;if(b.every(Boolean))return 0;let vals=[];b.forEach((v,j)=>{if(!v){b[j]=turn;vals.push({j,s:minimax(b,turn==="O"?"X":"O")});b[j]=""}});return turn==="O"?Math.max(...vals.map(v=>v.s)):Math.min(...vals.map(v=>v.s));}
    let best=-Infinity, move=-1;board.forEach((v,j)=>{if(!v){board[j]="O";const s=minimax(board,"X");board[j]="";if(s>best){best=s;move=j;}}});
    if(move>=0)board[move]="O";
    if(win(board,"O")){over=true;paint("Axon wins. The calculators remain undefeated. 💀");}
    else if(board.every(Boolean)){over=true;paint("Draw. Humanity survives another round.");}else paint("Your move.");
  };
  stageHandlers["ttt-restart"]=()=>{board=Array(9).fill("");over=false;paint("Your move.");};
  paint("Your move.");
}

function playConnect4() {
  let b=Array.from({length:6},()=>Array(7).fill(0)),over=false;
  showStage("Connect Four",`<p class="game-subtitle">Drop yellow discs. First to connect four wins.</p><div class="connect-board">${Array.from({length:42},(_,i)=>`<button class="connect-cell" data-action="c4-drop" data-col="${i%7}" aria-label="Drop in column ${i%7+1}"></button>`).join("")}</div><div id="c4Status" class="game-result">Your turn.</div>${button("Restart","c4-restart","secondary")}`);
  function won(p){for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(p===b[r][c]&&[[0,1],[1,0],[1,1],[-1,1]].some(([dr,dc])=>[0,1,2,3].every(k=>b[r+dr*k]?.[c+dc*k]===p)))return true;return false;}
  function moves(){return Array.from({length:7},(_,c)=>c).filter(c=>b[0][c]===0);}
  function drop(c,p){for(let r=5;r>=0;r--)if(!b[r][c]){b[r][c]=p;return true;}return false;}
  function paint(msg){stage.querySelectorAll(".connect-cell").forEach((el,i)=>{const v=b[Math.floor(i/7)][i%7];el.className="connect-cell"+(v===1?" disc-human":v===2?" disc-ai":"");el.disabled=over||b[0][i%7]!==0;});$("c4Status").textContent=msg;}
  function ai(){const ms=moves();if(!ms.length)return;let c=ms.find(c=>{let r=5;while(r>=0&&b[r][c])r--;if(r<0)return false;b[r][c]=2;let w=won(2);b[r][c]=0;return w;});if(c===undefined)c=ms.find(c=>{let r=5;while(r>=0&&b[r][c])r--;if(r<0)return false;b[r][c]=1;let w=won(1);b[r][c]=0;return w;});if(c===undefined)c=ms.sort((a,z)=>Math.abs(3-a)-Math.abs(3-z))[0];drop(c,2);if(won(2)){over=true;paint("Axon connects four. GG!");}else if(!moves().length){over=true;paint("Draw game!");}else paint("Your turn.");}
  stageHandlers["c4-drop"]=btn=>{const c=Number(btn.dataset.col);if(over||!drop(c,1))return;if(won(1)){over=true;paint("YOU CONNECTED FOUR! 🏆");}else if(!moves().length){over=true;paint("Draw game!");}else{paint("Axon is thinking…");window.setTimeout(()=>{if(!over)ai();},220);}};
  stageHandlers["c4-restart"]=()=>{b=Array.from({length:6},()=>Array(7).fill(0));over=false;paint("Your turn.");};paint("Your turn.");
}

async function playChess() {
  showStage("Chess",`<p class="game-subtitle">White moves first. Tap a piece, then tap its destination. Axon replies automatically.</p><div id="chessBoard" class="chess-board" aria-label="Chess board"></div><div id="chessStatus" class="game-result">Loading chess rules…</div>${button("New game","chess-restart","secondary")}`);
  try {
    chessModulePromise ||= import("https://esm.sh/chess.js@1.4.0");
    const {Chess}=await chessModulePromise;
    if(stage.classList.contains("hidden"))return;
    let chess=new Chess(), selected=null, legal=[];
    const boardEl=$("chessBoard");
    const glyph={wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"};
    function paint(){const b=chess.board();boardEl.innerHTML=b.flatMap((row,r)=>row.map((p,c)=>{const sq="abcdefgh"[c]+(8-r),key=p?(p.color+p.type):"";return `<button class="chess-square ${(r+c)%2?"dark":"light"} ${selected===sq?"selected":""} ${legal.some(m=>m.to===sq)?"legal-target":""}" data-action="chess-square" data-square="${sq}" aria-label="${sq} ${key}">${p?glyph[key]:""}</button>`;})).join("");$("chessStatus").textContent=chess.isGameOver()?(chess.isCheckmate()?(chess.turn()==="w"?"Axon wins by checkmate.":"Checkmate! You win! 🏆"): "Game over: draw."):(chess.isCheck()?"Check! ":"Your turn.");}
    async function reply(){if(chess.isGameOver())return;const ms=chess.moves();if(!ms.length)return;const move=ms[Math.floor(Math.random()*ms.length)];chess.move(move);paint();}
    stageHandlers["chess-square"]=async btn=>{if(chess.isGameOver()||chess.turn()!=="w")return;const sq=btn.dataset.square;if(selected&&legal.some(m=>m.to===sq)){try{chess.move({from:selected,to:sq,promotion:"q"});selected=null;legal=[];paint();if(!chess.isGameOver())window.setTimeout(reply,300);}catch{selected=null;legal=[];paint();}}else{const p=chess.get(sq);if(p?.color==="w"){selected=sq;legal=chess.moves({square:sq,verbose:true});paint();}else{selected=null;legal=[];paint();}}};
    stageHandlers["chess-restart"]=()=>{chess.reset();selected=null;legal=[];paint();};
    paint();
  } catch {
    $("chessStatus").textContent="Chess rules couldn't load. Check your internet connection and reopen the game.";
  }
}

const triviaQuestions=[
 {q:"Which planet has the most confirmed moons (as of recent counts)?",a:["Earth","Saturn","Mars","Venus"],correct:1,why:"Saturn currently leads in confirmed moon counts."},
 {q:"What is the chemical symbol for gold?",a:["Ag","Gd","Au","Go"],correct:2,why:"Au comes from the Latin word aurum."},
 {q:"Which ocean is the largest?",a:["Atlantic","Indian","Arctic","Pacific"],correct:3,why:"The Pacific Ocean is the largest."},
 {q:"What does CPU stand for?",a:["Central Processing Unit","Computer Power Utility","Core Program Unit","Central Performance User"],correct:0,why:"CPU means Central Processing Unit."},
 {q:"How many sides does a hexagon have?",a:["5","6","7","8"],correct:1,why:"A hexagon has six sides."},
 {q:"Which gas do plants absorb for photosynthesis?",a:["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"],correct:2,why:"Plants use carbon dioxide, water, and light in photosynthesis."},
 {q:"What is the largest mammal?",a:["African elephant","Blue whale","Giraffe","Orca"],correct:1,why:"The blue whale is the largest known animal."},
 {q:"Which language runs natively in web browsers?",a:["Java","C#","JavaScript","Rust"],correct:2,why:"JavaScript is supported directly by modern browsers."}
];
function playTrivia(){let order=[],i=0,score=0,answered=false;function draw(){answered=false;if(i>=order.length){showStage("Trivia Showdown",`<div class="game-finish"><div class="game-big-icon">🏆</div><h3>Round complete!</h3><p>You scored <b>${score}/${order.length}</b>.</p><p>${score===order.length?"Perfect run. Axon is concerned.":score>=5?"Solid knowledge!":"Rematch and beat your score."}</p>${button("Play again","trivia-restart")}</div>`);return;}const q=order[i];showStage("Trivia Showdown",`<div class="quiz-progress">QUESTION ${i+1} / ${order.length}<span>Score: ${score}</span></div><h3 class="quiz-question">${q.q}</h3><div class="quiz-options">${q.a.map((a,j)=>`<button type="button" class="quiz-option" data-action="trivia-answer" data-answer="${j}">${a}</button>`).join("")}</div><div id="triviaFeedback" class="game-result" aria-live="polite"></div><div class="game-actions">${button("Next question →","trivia-next","secondary")}</div>`);stage.querySelector('[data-action="trivia-next"]').disabled=true;}function start(){order=[...triviaQuestions].sort(()=>Math.random()-.5).slice(0,5);i=0;score=0;draw();}stageHandlers["trivia-answer"]=b=>{if(answered)return;answered=true;const q=order[i],ok=Number(b.dataset.answer)===q.correct;if(ok)score++;stage.querySelectorAll(".quiz-option").forEach((el,j)=>{el.disabled=true;if(j===q.correct)el.classList.add("answer-correct");else if(j===Number(b.dataset.answer))el.classList.add("answer-wrong");});$("triviaFeedback").textContent=(ok?"Correct! ":"Not quite. ")+q.why;stage.querySelector('[data-action="trivia-next"]').disabled=false;};stageHandlers["trivia-next"]=()=>{if(answered){i++;draw();}};stageHandlers["trivia-restart"]=start;start();}

const riddles=[
 {q:"I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?",a:["A keyboard","A map","A piano"],correct:0,hint:"You're probably using one right now."},
 {q:"The more you take, the more you leave behind. What are they?",a:["Photographs","Footsteps","Coins"],correct:1,hint:"Think about walking."},
 {q:"What has a neck but no head?",a:["A bottle","A shirt","A guitar"],correct:0,hint:"You might drink from it."},
 {q:"What gets wetter the more it dries?",a:["A sponge","A towel","Rain"],correct:1,hint:"It's usually in the bathroom."},
 {q:"What has cities but no houses, forests but no trees, and water but no fish?",a:["A globe","A map","A painting"],correct:1,hint:"It helps you find your way."}
];
function playRiddle(){let index=0,score=0,usedHint=false,order=[];function draw(){usedHint=false;if(index>=order.length){showStage("Riddle Master",`<div class="game-finish"><div class="game-big-icon">🧩</div><h3>Riddle run complete!</h3><p>You solved ${score} of ${order.length}.</p>${button("Play again","riddle-restart")}</div>`);return;}const r=order[index];showStage("Riddle Master",`<div class="quiz-progress">RIDDLE ${index+1} / ${order.length}<span>Solved: ${score}</span></div><h3 class="quiz-question">${r.q}</h3><div class="quiz-options">${r.a.map((a,j)=>`<button class="quiz-option" data-action="riddle-answer" data-answer="${j}">${a}</button>`).join("")}</div><div id="riddleFeedback" class="game-result"></div><div class="game-actions">${button("💡 Hint","riddle-hint","secondary")}${button("Next →","riddle-next","secondary")}</div>`);stage.querySelector('[data-action="riddle-next"]').disabled=true;}function start(){order=[...riddles].sort(()=>Math.random()-.5);index=0;score=0;draw();}stageHandlers["riddle-answer"]=b=>{if(stage.querySelector(".quiz-option").disabled)return;const r=order[index],ok=Number(b.dataset.answer)===r.correct;if(ok)score++;stage.querySelectorAll(".quiz-option").forEach((el,j)=>{el.disabled=true;if(j===r.correct)el.classList.add("answer-correct");else if(j===Number(b.dataset.answer))el.classList.add("answer-wrong");});$("riddleFeedback").textContent=ok?"Correct! 🧠":"Not quite — the answer is "+r.a[r.correct]+".";stage.querySelector('[data-action="riddle-next"]').disabled=false;};stageHandlers["riddle-hint"]=()=>{if(!usedHint){$("riddleFeedback").textContent="Hint: "+order[index].hint;usedHint=true;}};stageHandlers["riddle-next"]=()=>{if(!stage.querySelector(".quiz-option").disabled)return;index++;draw();};stageHandlers["riddle-restart"]=start;start();}

const wordBank=["APPLE","BRAVE","CLOUD","DREAM","FLAME","GRAPE","HOUSE","LASER","MOUSE","NIGHT","OCEAN","PIXEL","QUEST","ROBOT","SHARK","TIGER","WHALE","ZEBRA"];
function playWord(){let answer="",guesses=[],over=false;function start(){answer=wordBank[Math.floor(Math.random()*wordBank.length)];guesses=[];over=false;draw();}function draw(){showStage("Word Guess",`<p class="game-subtitle">Guess the five-letter word in six tries. Green = right letter and place; gold = letter is elsewhere.</p><div class="word-grid">${Array.from({length:6},(_,r)=>Array.from({length:5},(_,c)=>`<div class="word-tile ${guesses[r]?.marks[c]||""}">${guesses[r]?.word[c]||""}</div>`).join("")).join("")}</div><form data-game-form="word-submit" class="word-form"><input id="wordInput" maxlength="5" minlength="5" pattern="[A-Za-z]{5}" autocomplete="off" placeholder="TYPE WORD" aria-label="Five-letter guess" ${over?"disabled":""} required><button class="axon-game-button" type="submit" ${over?"disabled":""}>Guess</button></form><div id="wordStatus" class="game-result">${over?(guesses.at(-1)?.word===answer?"Solved! 🏆":"The word was "+answer+"."):"Guess "+(guesses.length+1)+" of 6"}</div>${button("New word","word-restart","secondary")}`);if(!over)$("wordInput").focus();}stageHandlers["word-submit"]=form=>{if(over)return;const input=$("wordInput"),word=input.value.toUpperCase();if(!/^[A-Z]{5}$/.test(word)){input.setCustomValidity("Enter five letters.");input.reportValidity();return;}input.setCustomValidity("");const left=answer.split(""),marks=Array(5).fill("tile-gray");for(let i=0;i<5;i++)if(word[i]===left[i]){marks[i]="tile-green";left[i]="";}for(let i=0;i<5;i++)if(marks[i]!=="tile-green"){const p=left.indexOf(word[i]);if(p>=0){marks[i]="tile-gold";left[p]="";}}guesses.push({word,marks});if(word===answer||guesses.length>=6)over=true;draw();};stageHandlers["word-restart"]=start;start();}

function canvasGame(title, instruction, setup){showStage(title,`<p class="game-subtitle">${instruction}</p><div class="arcade-wrap"><canvas id="arcadeCanvas" width="600" height="400" aria-label="${title} game"></canvas></div><div id="arcadeStatus" class="game-result">Use arrow keys or WASD. Use the on-screen button to pause.</div><div class="game-actions">${button("Restart","arcade-restart","secondary")}${button("Pause / Resume","arcade-pause","secondary")}</div>`);const canvas=$("arcadeCanvas"),ctx=canvas.getContext("2d");let raf=0,paused=false,ended=false;const keys=new Set();let state=setup();function loop(){if(ended)return;if(!paused){const status=state.update(keys,ctx,canvas);if(status){ended=true;$("arcadeStatus").textContent=status;}else state.draw(ctx,canvas);}raf=requestAnimationFrame(loop);}function key(e){if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)){e.preventDefault();}keys.add(e.key.toLowerCase());}function up(e){keys.delete(e.key.toLowerCase());}window.addEventListener("keydown",key);window.addEventListener("keyup",up);function clean(){cancelAnimationFrame(raf);window.removeEventListener("keydown",key);window.removeEventListener("keyup",up);}gameCleanup=clean;stageHandlers["arcade-restart"]=()=>{clean();canvasGame(title,instruction,setup);};stageHandlers["arcade-pause"]=()=>{paused=!paused;};loop();}
function playSnake(){canvasGame("Snake","Eat the glowing food. Arrow keys or WASD to steer.",()=>{let snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}],dir={x:1,y:0},food={x:17,y:10},tick=0,score=0;return{update(keys){if(keys.has("arrowup")||keys.has("w")){if(dir.y!==1)dir={x:0,y:-1};}if(keys.has("arrowdown")||keys.has("s")){if(dir.y!==-1)dir={x:0,y:1};}if(keys.has("arrowleft")||keys.has("a")){if(dir.x!==1)dir={x:-1,y:0};}if(keys.has("arrowright")||keys.has("d")){if(dir.x!==-1)dir={x:1,y:0};}if(++tick%7)return;$("arcadeStatus").textContent="Score: "+score;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=30||head.y<0||head.y>=20||snake.some((p,i)=>i>0&&p.x===head.x&&p.y===head.y))return "Game over! Score: "+score;snake.unshift(head);if(head.x===food.x&&head.y===food.y){score++;food={x:Math.floor(Math.random()*30),y:Math.floor(Math.random()*20)};}else snake.pop();},draw(ctx,c){ctx.fillStyle="#080511";ctx.fillRect(0,0,c.width,c.height);const w=c.width/30,h=c.height/20;ctx.fillStyle="#a855f7";snake.forEach(p=>ctx.fillRect(p.x*w+1,p.y*h+1,w-2,h-2));ctx.fillStyle="#facc15";ctx.beginPath();ctx.arc(food.x*w+w/2,food.y*h+h/2,Math.min(w,h)*.38,0,Math.PI*2);ctx.fill();}};});}
function playShooter(){canvasGame("Space Shooter","Move with ← → or A/D. Hold Space to fire.",()=>{let x=285,bullets=[],enemies=[],frame=0,score=0;return{update(keys){if(keys.has("arrowleft")||keys.has("a"))x-=5;if(keys.has("arrowright")||keys.has("d"))x+=5;x=Math.max(12,Math.min(588,x));if(keys.has(" ")&&frame%8===0)bullets.push({x,y:350});if(++frame%45===0)enemies.push({x:20+Math.random()*560,y:-10});bullets.forEach(b=>b.y-=7);enemies.forEach(e=>e.y+=1.8);bullets=bullets.filter(b=>b.y>0);for(const e of enemies){const hit=bullets.findIndex(b=>Math.abs(b.x-e.x)<17&&Math.abs(b.y-e.y)<17);if(hit>=0){bullets.splice(hit,1);e.y=500;score++;}}enemies=enemies.filter(e=>e.y<420);$("arcadeStatus").textContent="Score: "+score+" · Move: ← → · Fire: Space";if(enemies.some(e=>e.y>365&&Math.abs(e.x-x)<23))return "Ship hit! Final score: "+score;},draw(ctx,c){ctx.fillStyle="#080511";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#a855f7";for(let i=0;i<35;i++){ctx.fillRect((i*97+frame*0.5)%600,(i*61)%400,2,2);}ctx.fillStyle="#c084fc";ctx.beginPath();ctx.moveTo(x,330);ctx.lineTo(x-15,360);ctx.lineTo(x+15,360);ctx.fill();ctx.fillStyle="#67e8f9";bullets.forEach(b=>ctx.fillRect(b.x-2,b.y,4,12));ctx.fillStyle="#fb7185";enemies.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,12,0,Math.PI*2);ctx.fill();});}};});}

async function askAxon(system,prompt,fallback){try{const user=getAuth(getApps()[0]).currentUser;const headers={"Content-Type":"application/json"};if(user)headers.Authorization="Bearer "+await user.getIdToken();const res=await fetch(BACKEND_URL+"/api/chat",{method:"POST",headers,body:JSON.stringify({prompt,system,workMode:false,adminAction:null,targetUser:null})});const data=await res.json();if(res.ok&&data.answer)return data.answer;}catch(e){console.warn("Axon Games AI fallback:",e);}return fallback;}
function playAdventure(){
  let history=[],turn=0,currentScene="",busy=false,requestId=0,batchId=0;
  let branchPromises=[],branchResults=[];
  const fallbackScenes=[
    {scene:"You arrive at a strange crossroads where a lantern glows with blue fire. A narrow path leads into mist, another winds toward distant bells, and a tiny boat waits beside a silent river.",choices:["Follow the blue lanterns","Walk toward the bells","Ask the boat's mysterious ferryman for help"]},
    {scene:"Your choice leads somewhere unexpected. The air shifts, a new landmark appears ahead, and you notice a small detail that might become important later.",choices:["Investigate the unusual detail","Continue toward the new landmark","Speak to the nearest character"]},
    {scene:"The world reacts to what you did. Someone nearby recognizes you, and a fresh opportunity opens up that wasn't there before.",choices:["Hear them out","Test the new opportunity","Look around for another way forward"]}
  ];
  const system="You are the game master for Axon Adventure, an ongoing, branching, family-friendly interactive story. Invent a genuinely NEW next scene and three meaningful choices. Never repeat a fixed story path, never force a predetermined ending, and never mention a Crystal Archive. The world, characters, items, consequences, mysteries and goals should evolve from the player's previous choices. Remember continuity: don't contradict established facts, and let past choices matter. The story can continue indefinitely; do not conclude it unless the player explicitly asks to finish. Keep it vivid but concise (2-5 sentences). Provide exactly three short actionable choices. Keep content suitable for a teen; no graphic violence or sexual content. Return ONLY valid JSON with this shape: {\"scene\":\"scene text\",\"choices\":[\"choice one\",\"choice two\",\"choice three\"]}.";
  function parseScene(raw){
    const cleaned=String(raw||"").replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
    let data;
    try{data=JSON.parse(cleaned);}catch{
      const match=cleaned.match(/\{[\s\S]*\}/);
      if(match){try{data=JSON.parse(match[0]);}catch{}}
    }
    if(!data||typeof data!=="object")return null;
    const scene=String(data.scene||data.story||data.narration||"").trim();
    const choices=Array.isArray(data.choices)?data.choices.map(c=>String(c).trim()).filter(Boolean).slice(0,3):[];
    if(!scene||choices.length<2)return null;
    return {scene,choices};
  }
  function fallbackFor(choice){
    const f=fallbackScenes[turn%fallbackScenes.length];
    return {scene:(choice?"After you "+choice.charAt(0).toLowerCase()+choice.slice(1)+", ":"")+f.scene,choices:f.choices};
  }
  async function createScene(priorHistory,choice){
    const recent=priorHistory.slice(-12).map((h,i)=>`${i+1}. Scene: ${h.scene}\nPlayer chose: ${h.choice}`).join("\n\n")||"This is the very beginning. Invent a fresh, intriguing opening scene.";
    const previousScene=priorHistory.length?priorHistory[priorHistory.length-1].scene:currentScene;
    const prompt="Create the next playable scene for this continuing adventure.\nDecision number: "+(priorHistory.length+1)+"\nPrevious journey (oldest first):\n"+recent+"\n\n"+(choice?"The player chose: "+choice+". The scene immediately before this choice was: "+previousScene+". Show a consequence and advance the story in an interesting, not necessarily predictable way.":"Begin with a compelling opening and a clear situation to explore.")+"\nGenerate a new scene and three distinct choices. Do not repeat previous scenes or choices verbatim.";
    try{
      const raw=await askAxon(system,prompt,"");
      const parsed=parseScene(raw);
      if(parsed)return {...parsed,aiGenerated:true};
    }catch(err){console.warn("Axon Adventure generation failed:",err);}
    return {...fallbackFor(choice),aiGenerated:false};
  }
  function draw(loading=false){
    const visibleChoices=loading?[]:(window.__axonAdventureChoices||[]);
    showStage("AI Adventure",`<div class="adventure-scene"><div class="adventure-art">🌌</div><div class="quiz-progress"><strong>YOUR STORY</strong><span>Chapter ${turn+1} · ${history.length} decisions</span></div><p id="adventureSceneText" aria-live="polite">${safeText(currentScene||"Axon is creating a brand-new adventure for you…")}</p><div class="adventure-choices">${loading?'<p class="game-muted">✨ Axon is imagining what happens next…</p>':visibleChoices.map((c,i)=>button(safeText(c),"adventure-choice","secondary")).join("")}</div><p id="adventureStatus" class="game-result" role="status">${loading?"Generating your next scene…":"Axon is quietly preparing possible outcomes while you decide. There is no fixed ending."}</p><div class="game-actions">${button("🔄 Start a new story","adventure-restart","secondary")}</div></div>`);
    stage.querySelectorAll('[data-action="adventure-choice"]').forEach((el,i)=>{el.dataset.choice=String(i);});
    stage.querySelectorAll('[data-action="adventure-choice"],[data-action="adventure-restart"]').forEach(el=>{el.disabled=loading;});
  }
  function prefetchBranches(){
    const thisBatch=++batchId;
    const sceneAtDecision=currentScene;
    const options=[...(window.__axonAdventureChoices||[])];
    branchResults=new Array(options.length);
    branchPromises=options.map((choice,index)=>{
      const hypotheticalHistory=[...history,{turn,choice,scene:sceneAtDecision}];
      return createScene(hypotheticalHistory,choice).then(result=>{
        if(thisBatch===batchId)branchResults[index]=result;
        return result;
      });
    });
    Promise.allSettled(branchPromises).then(()=>{
      if(thisBatch!==batchId||busy)return;
      const status=$("adventureStatus");
      if(status)status.textContent="✨ Possible outcomes are ready. Pick any choice to continue instantly.";
    });
  }
  async function startStory(){
    busy=true;
    const thisRequest=++requestId;
    batchId++;
    history=[];turn=0;currentScene="";window.__axonAdventureChoices=[];branchPromises=[];branchResults=[];
    draw(true);
    const result=await createScene([],"");
    if(thisRequest!==requestId)return;
    currentScene=result.scene;
    window.__axonAdventureChoices=result.choices;
    draw(false);
    const status=$("adventureStatus");
    if(status&&!result.aiGenerated)status.textContent="AI didn't respond, so this is a temporary scene. You can keep playing.";
    busy=false;
    prefetchBranches();
  }
  async function chooseBranch(index){
    if(busy)return;
    const choice=window.__axonAdventureChoices?.[index];
    if(!choice)return;
    busy=true;
    const thisRequest=++requestId;
    const selectedPromise=branchPromises[index];
    const ready=branchResults[index];
    history.push({turn,choice,scene:currentScene});
    turn=history.length;
    if(ready){
      currentScene=ready.scene;
      window.__axonAdventureChoices=ready.choices;
      draw(false);
      const status=$("adventureStatus");
      if(status&&!ready.aiGenerated)status.textContent="AI didn't respond for that branch, so this is a temporary scene. Your adventure continues.";
      busy=false;
      prefetchBranches();
      return;
    }
    window.__axonAdventureChoices=[];
    currentScene="Your choice: "+choice+"\n\nAxon is finishing the scene it started preparing…";
    draw(true);
    let result;
    try{result=selectedPromise?await selectedPromise:await createScene(history,choice);}catch{result={...fallbackFor(choice),aiGenerated:false};}
    if(thisRequest!==requestId)return;
    currentScene=result.scene;
    window.__axonAdventureChoices=result.choices;
    draw(false);
    const status=$("adventureStatus");
    if(status&&!result.aiGenerated)status.textContent="AI didn't respond for that branch, so this is a temporary scene. Your adventure continues.";
    busy=false;
    prefetchBranches();
  }
  stageHandlers["adventure-choice"]=b=>chooseBranch(Number(b.dataset.choice));
  stageHandlers["adventure-restart"]=()=>{requestId++;batchId++;busy=false;startStory();};
  startStory();
}
function playMystery(){
  let caseFile=null,seen=new Set(),interviews={},activeSuspect=-1,solved=false,busy=false,caseId=0;
  const fallbackCase={
    title:"The Vanishing Observatory Key",
    intro:"At 9:15 PM, the key to the hilltop observatory vanished just before a rare comet appeared. Three people were nearby, and each has a reason to be hiding something.",
    suspects:[
      {name:"Mira Vale",role:"Astronomy student",personality:"precise and nervous",alibi:"She says she was recording the comet forecast in the control room.",secret:"She borrowed a star chart earlier without signing it out."},
      {name:"Jonah Reed",role:"Night caretaker",personality:"gruff but observant",alibi:"He says he was checking the generator in the basement.",secret:"He heard footsteps on the stairs but didn't report them."},
      {name:"Tess Morgan",role:"Science journalist",personality:"charming and evasive",alibi:"She says she was outside taking photographs.",secret:"She wanted an exclusive photograph from inside the observatory."}
    ],
    clues:[
      {id:"mud",icon:"👣",title:"Muddy prints",text:"A line of muddy prints runs from the outside stairwell to the observatory door. The prints are narrow and stop at the door."},
      {id:"log",icon:"📋",title:"Generator log",text:"The generator log shows a brief restart at 9:08 PM. The basement lights would have flickered during the restart."},
      {id:"chart",icon:"🌠",title:"Marked star chart",text:"A star chart has a fresh pencil mark pointing to a window beside the key cabinet."},
      {id:"photo",icon:"📷",title:"Camera photo",text:"A photo timestamped 9:11 PM shows a reflection in the observatory glass, but the person holding the camera is outside."}
    ],
    culprit:2,
    solution:"Tess took the key to get an exclusive inside photograph. The muddy prints and her photo timestamp put her at the door, while the marked chart shows she had found a way to reach the cabinet."
  };
  const system="You design fair, solvable, family-friendly detective mysteries for a teen. Invent a completely new case every time: change the setting, missing/stolen/mysterious event, suspects, motives, evidence, and culprit. No gore or sexual content. The culprit must be exactly one of the three suspects, and the clues must logically support the solution without making it obvious from the start. Return ONLY valid JSON: {\"title\":\"case title\",\"intro\":\"2-3 sentence setup\",\"suspects\":[{\"name\":\"name\",\"role\":\"role\",\"personality\":\"brief personality\",\"alibi\":\"what they claim\",\"secret\":\"a secret that may or may not prove guilt\"}],\"clues\":[{\"id\":\"shortid\",\"icon\":\"emoji\",\"title\":\"clue title\",\"text\":\"specific evidence\"}],\"culprit\":0,\"solution\":\"clear explanation using the evidence\"}. Exactly 3 distinct suspects and 4 distinct clues. culprit is 0, 1, or 2. Ensure all names and case details are new.";
  function parseJSON(raw){
    const cleaned=String(raw||"").replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
    try{return JSON.parse(cleaned);}catch{const m=cleaned.match(/\{[\s\S]*\}/);if(m){try{return JSON.parse(m[0]);}catch{}}}
    return null;
  }
  function validCase(data){
    if(!data||typeof data!=="object"||!String(data.title||"").trim()||!String(data.intro||"").trim()||!String(data.solution||"").trim())return false;
    if(!Array.isArray(data.suspects)||data.suspects.length!==3||!Array.isArray(data.clues)||data.clues.length<3||![0,1,2].includes(Number(data.culprit)))return false;
    return data.suspects.every(s=>s&&s.name&&s.role&&s.alibi&&s.secret)&&data.clues.every(c=>c&&c.id&&c.title&&c.text);
  }
  async function askForCase(){
    try{
      const raw=await askAxon(system,"Create one original detective case. Avoid common repeated setups like a missing blue folder. Make the evidence useful for both clue inspection and suspect questioning.","");
      const data=parseJSON(raw);
      if(validCase(data))return {...data,culprit:Number(data.culprit),aiGenerated:true};
    }catch(err){console.warn("Mystery case generation failed:",err);}
    return {...fallbackCase,aiGenerated:false};
  }
  function suspectQuestions(s,index){
    return ["Check their alibi against the timeline","Ask what they know about one clue","Ask what they were trying to achieve that night"];
  }
  function draw(){
    if(!caseFile)return;
    const suspect=activeSuspect>=0?caseFile.suspects[activeSuspect]:null;
    const content=suspect? `
      <p class="game-subtitle">QUESTIONING ROOM · Interview one suspect at a time. Compare their answers with your evidence.</p>
      <div class="mystery-note"><b>${safeText(suspect.name)}</b> · ${safeText(suspect.role)}<br><i>Claimed alibi:</i> ${safeText(suspect.alibi)}</div>
      <div class="mystery-clues">${suspectQuestions(suspect,activeSuspect).map((q,i)=>button(safeText(q),"mystery-question","secondary")).join("")}</div>
      <form data-game-form="mystery-ask" class="mystery-note" style="display:grid;gap:10px;margin-top:14px">
        <label for="mysteryQuestionInput"><b>Ask your own question</b></label>
        <input id="mysteryQuestionInput" name="question" maxlength="240" required placeholder="Where were you when the key disappeared?" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px">
        <button type="submit" class="axon-game-button">Ask ${safeText(suspect.name)}</button>
      </form>
      <div id="mysteryInterview" class="mystery-note" aria-live="polite">${(interviews[activeSuspect]||[]).map(m=>`<p><b>Detective:</b> ${safeText(m.q)}<br><b>${safeText(suspect.name)}:</b> ${safeText(m.a)}</p>`).join("")||"The suspect is waiting for your questions."}</div>
      <div class="game-actions">${button("← Back to case","mystery-case","secondary")}</div>` : `
      <p class="game-subtitle">${safeText(caseFile.intro)}</p>
      <div class="quiz-progress"><strong>${safeText(caseFile.title)}</strong><span>${seen.size}/${caseFile.clues.length} clues examined</span></div>
      <h3>Evidence board</h3>
      <div class="mystery-clues">${caseFile.clues.map(c=>`<button class="mystery-clue ${seen.has(c.id)?"clue-seen":""}" data-action="mystery-clue" data-clue="${safeText(c.id)}"><span>${safeText(c.icon||"🔎")}</span><b>${safeText(c.title)}</b><small>${seen.has(c.id)?"Examined":"Inspect evidence"}</small></button>`).join("")}</div>
      <div id="mysteryNote" class="mystery-note">${seen.size?seen.size+" of "+caseFile.clues.length+" clues examined. Select any clue to read it.":"Inspect the evidence and question the suspects before making your accusation."}</div>
      <h3>Question the suspects</h3>
      <div class="mystery-clues">${caseFile.suspects.map((s,i)=>`<button class="mystery-clue" data-action="mystery-interview" data-suspect="${i}"><span>🗣️</span><b>${safeText(s.name)}</b><small>${safeText(s.role)}</small></button>`).join("")}</div>
      <h3>Make your accusation</h3>
      <p class="game-muted">You can accuse someone at any time, but checking the clues and alibis may help.</p>
      <div class="quiz-options">${caseFile.suspects.map((s,i)=>`<button class="quiz-option" data-action="mystery-answer" data-answer="${i}" ${solved?"disabled":""}>${safeText(s.name)}</button>`).join("")}</div>
      <div id="mysteryFeedback" class="game-result" role="status">${solved?(Number(caseFile.culprit)===-1?"": ""):""}</div>
      ${button("🗂️ Generate a new case","mystery-restart","secondary")}`;
    showStage("Mystery Detective",`<div class="adventure-scene"><div class="adventure-art">🕵️</div>${content}</div>`);
    if(suspect){
      stage.querySelectorAll('[data-action="mystery-question"]').forEach((el,i)=>el.dataset.questionIndex=String(i));
      const input=$("mysteryQuestionInput");
      if(input)input.focus();
    }
    if(solved&&!suspect){
      const feedback=$("mysteryFeedback");
      if(feedback)feedback.textContent=caseFile.lastFeedback||"Case closed.";
    }
  }
  function showClue(id){
    const clue=caseFile.clues.find(c=>c.id===id);
    if(!clue)return;
    seen.add(id);draw();
    const note=$("mysteryNote");
    if(note)note.textContent=clue.title+": "+clue.text;
  }
  async function questionSuspect(index,question){
    if(busy||!caseFile?.suspects[index])return;
    const q=String(question||"").trim();if(!q)return;
    busy=true;
    const suspect=caseFile.suspects[index];
    const prior=interviews[index]||[];
    const transcript=prior.slice(-8).map(m=>"Detective: "+m.q+"\n"+suspect.name+": "+m.a).join("\n");
    const prompt="You are roleplaying as a suspect in a fair, family-friendly detective mystery. Stay in character as this suspect; answer the detective's question naturally in 1-4 sentences. You may be nervous, evasive, mistaken, or truthful, but never contradict the case facts or invent evidence that breaks the solution. The culprit is secretly "+caseFile.suspects[caseFile.culprit].name+"; only that suspect may gradually reveal inconsistencies. Do not plainly announce who is guilty.\nCASE: "+caseFile.title+"\nSETUP: "+caseFile.intro+"\nALL SUSPECTS: "+caseFile.suspects.map(s=>s.name+" ("+s.role+"), alibi: "+s.alibi+", private detail: "+s.secret).join(" | ")+"\nEVIDENCE: "+caseFile.clues.map(c=>c.title+": "+c.text).join(" | ")+"\nSOLUTION (keep secret): "+caseFile.solution+"\nYOU ARE: "+suspect.name+"; role: "+suspect.role+"; personality: "+suspect.personality+"; alibi: "+suspect.alibi+"; secret: "+suspect.secret+"\nPREVIOUS INTERVIEW:\n"+(transcript||"This is the first question.")+"\nDETECTIVE'S QUESTION: "+q+"\nRespond only with the suspect's spoken answer, no labels or narration.";
    const target=$("mysteryInterview");
    if(target)target.innerHTML='<p class="game-muted">💬 The suspect is thinking…</p>';
    try{
      const raw=await askAxon("You are an actor playing one suspect in an interactive detective game. Follow the supplied case facts and remain in character. Keep it teen-friendly.",prompt,"");
      const answer=String(raw||"").trim()||"I… I'm not sure how to answer that.";
      (interviews[index]??=[]).push({q,a:answer});
    }catch(err){
      console.warn("Suspect questioning failed:",err);
      (interviews[index]??=[]).push({q,a:"I can't answer right now. Try asking again in a moment."});
    }
    busy=false;
    draw();
  }
  stageHandlers["mystery-clue"]=b=>showClue(b.dataset.clue);
  stageHandlers["mystery-interview"]=b=>{activeSuspect=Number(b.dataset.suspect);draw();};
  stageHandlers["mystery-case"]=()=>{activeSuspect=-1;draw();};
  stageHandlers["mystery-question"]=b=>{
    const s=caseFile?.suspects[activeSuspect];if(!s)return;
    const prompts=[
      "Can you explain your alibi and the timeline?",
      "What do you know about the evidence in this case?",
      "What were you hoping to accomplish that night?"
    ];
    questionSuspect(activeSuspect,prompts[Number(b.dataset.questionIndex)]||prompts[0]);
  };
  stageHandlers["mystery-answer"]=b=>{
    if(solved||activeSuspect>=0)return;
    solved=true;
    const correct=Number(b.dataset.answer)===Number(caseFile.culprit);
    caseFile.lastFeedback=correct?"Case solved! "+caseFile.solution:"Not quite. The evidence points to "+caseFile.suspects[caseFile.culprit].name+". "+caseFile.solution;
    draw();
  };
  stageHandlers["mystery-restart"]=()=>{caseId++;seen=new Set();interviews={};activeSuspect=-1;solved=false;busy=false;caseFile=null;startCase();};
  async function startCase(){
    const thisCase=++caseId;
    busy=true;
    showStage("Mystery Detective",'<div class="adventure-scene"><div class="adventure-art">🕵️</div><p class="game-muted">Axon is inventing a brand-new case, suspects, clues and a solution…</p></div>');
    const generated=await askForCase();
    if(thisCase!==caseId)return;
    caseFile=generated;seen=new Set();interviews={};activeSuspect=-1;solved=false;busy=false;
    draw();
    if(!generated.aiGenerated){
      const note=$("mysteryNote");
      if(note)note.textContent="AI couldn't generate a new case just now, so a backup case is loaded. Generate a new case to try again later.";
    }
  }
  startCase();
}

cards.innerHTML = games.map(g => `<button type="button" class="game-card" data-game="${g.id}"><span class="game-card-icon">${g.icon}</span><span class="game-card-category">${g.category}</span><strong>${g.title}</strong><span class="game-card-desc">${g.desc}</span><span class="game-card-play">Play game <span aria-hidden="true">↗</span></span></button>`).join("");
