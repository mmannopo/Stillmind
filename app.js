const SOLUTION = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
];
const PUZZLES = {
  Beginner: [
    [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
  ],
  Easy: [
    [0,0,0,0,0,0,0,1,2],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,5,6,0],
    [0,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,0],
    [0,6,0,0,0,0,0,0,0],[0,0,0,0,0,9,0,0,0],[3,4,0,0,0,0,0,0,0]
  ],
  Medium: [
    [0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,5,0,0],
    [0,0,0,0,6,0,0,0,0],[4,0,0,0,0,0,0,0,1],[0,0,0,0,2,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
  ]
};
function makeTierPuzzle(clues,seed){const board=SOLUTION.map(row=>row.slice());let order=Array.from({length:81},(_,i)=>i),random=seed;for(let i=80;i>0;i--){random=(random*1664525+1013904223)>>>0;const j=random%(i+1);[order[i],order[j]]=[order[j],order[i]]}for(const i of order){if(board.flat().filter(Boolean).length<=clues)break;board[Math.floor(i/9)][i%9]=0}return board}
PUZZLES.Beginner=makeTierPuzzle(40,11);PUZZLES.Easy=makeTierPuzzle(34,74);PUZZLES.Medium=makeTierPuzzle(30,832);PUZZLES.Hard=makeTierPuzzle(26,641);PUZZLES.Expert=makeTierPuzzle(20,1729);
const $ = (s) => document.querySelector(s);
const state = {
  puzzle: [], values: [], notes: Array.from({length:81},()=>new Set()), selected: null,
  level: localStorage.getItem('stillmindDifficulty')||'Beginner', notesMode: false, checkMistakes: false, startedAt: Date.now(),
  elapsed: 0, timerInterval: null, toastTimeout: null,
  stats: JSON.parse(localStorage.getItem('stillmindStats') || '{"finished":0,"minutes":0,"streak":0,"lastDay":"","skills":[]}')
};
const GAME_KEY='stillmindActiveSudoku';
const THEMES=['green','purple','pink','blue','white','black'];
function applyTheme(theme=localStorage.getItem('stillmindTheme')||'green'){const selected=THEMES.includes(theme)?theme:'green';document.documentElement.dataset.theme=selected;localStorage.setItem('stillmindTheme',selected)}
function saveActiveGame(){if(!state.puzzle.length)return;state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);const snapshot={level:state.level,puzzle:state.puzzle,values:state.values,notes:state.notes.map(s=>[...s]),selected:state.selected,elapsed:state.elapsed,savedAt:new Date().toISOString()};try{localStorage.setItem(GAME_KEY,JSON.stringify(snapshot))}catch(error){console.warn('Could not save this Sudoku locally.',error)}}
function getSavedGame(){try{const saved=JSON.parse(localStorage.getItem(GAME_KEY)||'null');if(saved?.puzzle?.length===9&&saved?.values?.length===9&&saved.puzzle.every(row=>row.length===9)&&saved.values.every(row=>row.length===9))return saved}catch(error){console.warn('Could not restore the saved Sudoku.',error)}return null}

function saveStats(){localStorage.setItem('stillmindStats',JSON.stringify(state.stats));renderStats()}
function dayKey(date=new Date()){return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}
function renderStats(){
  $('#puzzlesCount').textContent=state.stats.finished;
  $('#minutesCount').textContent=state.stats.minutes;
  $('#streakCount').textContent=state.stats.streak;
  $('#streakText').textContent=state.stats.streak?`${state.stats.streak} day${state.stats.streak===1?'':'s'} of showing up`:'Your first day starts here';
  const skills=state.stats.skills.length?state.stats.skills:['Observation','Digit exclusions'];
  $('#skillPills').innerHTML=skills.slice(-3).map(x=>`<span>${x}</span>`).join('');
}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(state.toastTimeout);state.toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
function showModal(title,body,actions=[],eyebrow='A GENTLE START'){
  $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modalEyebrow').textContent=eyebrow;
  const wrap=$('#modalActions');wrap.innerHTML='';
  actions.forEach(({label,primary,onClick})=>{const b=document.createElement('button');b.className=primary?'primary-button':'secondary-button';b.textContent=label;b.onclick=()=>{$('#modal').close();if(onClick)onClick()};wrap.appendChild(b)});
  $('#modal').showModal();
}
function showHome(){clearInterval(state.timerInterval);$('#homeScreen').classList.remove('hidden');$('#gameScreen').classList.add('hidden');$('.bottom-nav').classList.remove('hidden');$('.nav-item').forEach(b=>b.classList.toggle('active',b.id==='homeTab'));renderStats()}
function startGame(level=state.level){
  if(!PUZZLES[level])level='Beginner';
  state.level=level;state.puzzle=PUZZLES[level].map(row=>row.slice());state.values=PUZZLES[level].map(row=>row.slice());
  localStorage.setItem('stillmindDifficulty',level);
  state.notes=Array.from({length:81},()=>new Set());state.selected=null;state.elapsed=0;state.startedAt=Date.now();
  $('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('.bottom-nav').classList.add('hidden');
  document.querySelectorAll('.difficulty-switch button').forEach(b=>b.classList.toggle('active',b.dataset.level===level));
  $('#notesState').textContent=state.notesMode?'on':'off';$('#mistakesState').textContent=state.checkMistakes?'on':'off';
  $('#notesButton').classList.toggle('on',state.notesMode);$('#mistakesButton').classList.toggle('on',state.checkMistakes);
  renderBoard();renderPad();clearInterval(state.timerInterval);state.timerInterval=setInterval(updateTimer,1000);updateTimer();saveActiveGame();
}
function resumeGame(saved=getSavedGame()){if(!saved)return startGame(state.level);state.level=saved.level||'Beginner';state.puzzle=saved.puzzle;state.values=saved.values;state.notes=(saved.notes||Array.from({length:81},()=>[])).map(s=>new Set(s));state.selected=saved.selected??null;state.elapsed=saved.elapsed||0;state.startedAt=Date.now()-state.elapsed*1000;$('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('.bottom-nav').classList.add('hidden');renderBoard();renderPad();clearInterval(state.timerInterval);state.timerInterval=setInterval(updateTimer,1000);updateTimer()}
function updateTimer(){state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);$('#timer').textContent=`${String(Math.floor(state.elapsed/60)).padStart(2,'0')}:${String(state.elapsed%60).padStart(2,'0')}`;if(state.elapsed%5===0)saveActiveGame()}
function getCandidates(r,c){
  if(state.values[r][c])return [];
  const used=new Set();for(let i=0;i<9;i++){used.add(state.values[r][i]);used.add(state.values[i][c]);}
  const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
  for(let y=br;y<br+3;y++)for(let x=bc;x<bc+3;x++)used.add(state.values[y][x]);
  return [1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n));
}
function cellIndex(r,c){return r*9+c}
function renderBoard(){
  const board=$('#board');board.innerHTML='';
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const idx=cellIndex(r,c),v=state.values[r][c],el=document.createElement('button');el.className='cell';el.setAttribute('role','gridcell');el.setAttribute('aria-label',`Row ${r+1}, column ${c+1}${v?`, ${v}`:''}`);el.dataset.index=idx;
    if(state.puzzle[r][c])el.classList.add('given');
    if(state.selected===idx)el.classList.add('selected');
    if(state.selected!==null){const sr=Math.floor(state.selected/9),sc=state.selected%9,sv=state.values[sr][sc];if((sr===r||sc===c||(Math.floor(sr/3)===Math.floor(r/3)&&Math.floor(sc/3)===Math.floor(c/3)))&&idx!==state.selected)el.classList.add('peer');if(sv&&v===sv&&idx!==state.selected)el.classList.add('same-number')}
    if(v){el.textContent=v;if(state.checkMistakes&&v!==SOLUTION[r][c]&&!state.puzzle[r][c])el.classList.add('mistake')}
    else if(state.notes[idx].size){const note=document.createElement('span');note.className='notes';note.innerHTML=[1,2,3,4,5,6,7,8,9].map(n=>`<span>${state.notes[idx].has(n)?n:''}</span>`).join('');el.appendChild(note)}
    el.addEventListener('click',()=>{state.selected=idx;renderBoard();saveActiveGame()});board.appendChild(el)
  }
}
function renderPad(){const pad=$('#numberPad');pad.innerHTML='';for(let n=1;n<=9;n++){const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-label',`Enter ${n}`);const count=state.values.flat().filter(v=>v===n).length;b.disabled=count>=9;b.onclick=()=>enterNumber(n);pad.appendChild(b)}}
function enterNumber(n){
  if(state.selected===null){showToast('Choose a square first.');return}
  const r=Math.floor(state.selected/9),c=state.selected%9;if(state.puzzle[r][c]){showToast('That number is part of the puzzle.');return}
  if(state.notesMode&&!state.values[r][c]){state.notes[state.selected].has(n)?state.notes[state.selected].delete(n):state.notes[state.selected].add(n)}else{state.values[r][c]=n;state.notes[state.selected].clear()}
  renderBoard();renderPad();saveActiveGame();if(state.values.flat().every(Boolean))finishGame()
}
function finishGame(){
  const wrong=state.values.some((row,r)=>row.some((v,c)=>v!==SOLUTION[r][c]));
  if(wrong){showToast('A few numbers need another look. Turn on mistake check or ask for a hint.');return}
  clearInterval(state.timerInterval);localStorage.removeItem(GAME_KEY);state.stats.finished++;state.stats.minutes+=Math.max(1,Math.round(state.elapsed/60));
  const today=dayKey(),yesterday=dayKey(new Date(Date.now()-86400000));if(state.stats.lastDay!==today){state.stats.streak=state.stats.lastDay===yesterday?state.stats.streak+1:1;state.stats.lastDay=today}
  saveStats();showModal('You did it, at your pace.','<p>Beautiful work. You completed a Sudoku and gave your mind a little room to grow.</p><div class="hint-callout">Time spent: '+$('#timer').textContent+'. Your progress is saved on this device.</div>',[{label:'Back to today',primary:true,onClick:showHome}], 'A MOMENT TO CELEBRATE');
}
function basicHint(){
  // Point to an actual naked single if one exists, then explain the row/column/box exclusions.
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!state.values[r][c]){const candidates=getCandidates(r,c);if(candidates.length===1)return {r,c,n:candidates[0],kind:'single'}}
  // Otherwise give a board-specific cell with a correct candidate list, without claiming it is forced.
  let best=null;for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!state.values[r][c]){const candidates=getCandidates(r,c);if(candidates.length&&(!best||candidates.length<best.candidates.length))best={r,c,candidates}}
  return best?{...best,kind:'scan'}:null
}
function teachMe(){
  const h=basicHint();if(!h){showToast('This board is complete.');return}
  const index=cellIndex(h.r,h.c);state.selected=index;renderBoard();
  if(h.kind==='single'){
    showModal('A number has only one place to go.',`<p>Look at <b>row ${h.r+1}, column ${h.c+1}</b>.</p><div class="hint-callout">${h.n} is the only number that can fit here. The other digits are already used in this square’s row, column, or 3×3 box.</div><p class="hint-step">This is called a <b>naked single</b>—a great first pattern to learn.</p>`,[{label:'Place '+h.n,primary:true,onClick:()=>{state.values[h.r][h.c]=h.n;renderBoard();renderPad();saveActiveGame();if(state.values.flat().every(Boolean))finishGame()}},{label:'I’ll try myself'}],'SUDOKU LESSON');
  }else{
    showModal('Let’s scan the possibilities.',`<p>We’ve highlighted <b>row ${h.r+1}, column ${h.c+1}</b> because it has one of the fewest open choices right now.</p><div class="hint-callout">The possible digits here are <b>${h.candidates.join(', ')}</b>. Each filled number in the same row, column, and 3×3 box rules out a candidate.</div><p class="hint-step">Try scanning one digit at a time across the highlighted row or box. We’ll add deeper pattern lessons as your practice grows.</p>`,[{label:'Got it',primary:true}],'SUDOKU LESSON');
  }
}
function showTutorial(){
  const steps=[
    {title:'Fill each group once.',body:'<p>Use the digits 1–9 once in every row, every column, and every 3×3 square. A number cannot repeat within one of those groups.</p><div class="hint-callout">Start by looking for a row, column, or square that already contains many digits.</div>',label:'Next'},
    {title:'Choose a square, then a digit.',body:'<p>Tap an empty square to select it, then tap a digit along the bottom to enter it. Use <b>Erase</b> to clear an entry. Turn on <b>Notes</b> to pencil in possible digits.</p>',label:'Next'},
    {title:'Ask for a hint whenever you like.',body:'<p><b>Teach me</b> gives a hint based on the current board. The mistake checker can highlight entries that don’t match the solution.</p><p>You can reopen this walkthrough any time with the <b>?</b> button.</p>',label:'Done'}
  ];
  let step=0;
  const present=()=>{const current=steps[step];showModal(current.title,current.body,[{label:current.label,primary:true,onClick:()=>{if(step<steps.length-1){step++;present()}}}],`HOW TO PLAY · ${step+1} OF ${steps.length}`)};
  present();
}
function resetProgress(){showModal('A fresh start, whenever you need one.','<p>Progress is only saved on this device. If you’re moving to a new phone, you can begin again with a short skill check to find a comfortable level.</p><p>This will clear your local streak and puzzle totals.</p>',[{label:'Keep my progress',onClick:()=>{}},{label:'Clear progress',primary:true,onClick:()=>{localStorage.removeItem('stillmindStats');state.stats={finished:0,minutes:0,streak:0,lastDay:'',skills:[]};saveStats();showToast('Your local progress has been cleared.')}}],'YOUR PROGRESS');}
function showRules(){showModal('A few rules, then you’re off.','<p>Fill each row, column, and 3×3 box with digits 1–9. A digit can only appear once in each.</p><p><b>Notes</b> help you keep track of candidates. <b>Check mistakes</b> highlights entries that don’t match this puzzle’s solution. <b>Teach me</b> explains a real deduction when one is available.</p>',[{label:'Got it',primary:true}],'SUDOKU BASICS')}

function chooseDifficulty(){const levels=['Beginner','Easy','Medium','Hard','Expert'];const saved=getSavedGame();const selector=`${saved?'<p class="saved-game-note">Your unfinished '+saved.level+' puzzle is saved on this device.</p>':'<p>Choose your difficulty before the puzzle begins.</p>'}<div class="start-levels">${levels.map(level=>`<button class="level-choice ${state.level===level?'selected':''}" data-start-level="${level}"><b>${level}</b><small>${({Beginner:'36–45 clues',Easy:'32–36 clues',Medium:'28–32 clues',Hard:'24–28 clues',Expert:'17–24 clues'})[level]}</small></button>`).join('')}</div>`;
  showModal(saved?'Continue your last game?':'Choose your Sudoku pace',selector,[...(saved?[{label:'Continue last game',primary:true,onClick:()=>resumeGame(saved)}]:[]),{label:'Start new game',primary:!saved,onClick:()=>{if(saved)localStorage.removeItem(GAME_KEY);startGame(state.level)}}],saved?'SAVED ON THIS DEVICE':'NEW PUZZLE');
  document.querySelectorAll('[data-start-level]').forEach(button=>button.addEventListener('click',()=>{state.level=button.dataset.startLevel;localStorage.setItem('stillmindDifficulty',state.level);document.querySelectorAll('[data-start-level]').forEach(b=>b.classList.toggle('selected',b===button))}));
}
function openSettings(){const theme=localStorage.getItem('stillmindTheme')||'green',music=localStorage.getItem('stillmindMusic')!=='off',sfx=localStorage.getItem('stillmindSfx')!=='off';showModal('Make Stillmind yours.',`<div class="settings-section"><h3>Sound</h3><label class="settings-row">Music <input type="checkbox" id="musicToggle" ${music?'checked':''}></label><label class="settings-row">Sound effects <input type="checkbox" id="sfxToggle" ${sfx?'checked':''}></label></div><div class="settings-section"><h3>Color theme</h3><div class="theme-options">${THEMES.map(t=>`<button class="theme-choice theme-${t} ${theme===t?'selected':''}" data-theme-choice="${t}" aria-label="${t} theme" aria-pressed="${theme===t}"><span></span>${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div></div><div class="settings-section"><h3>Support</h3><a class="support-link" href="mailto:hello@stillmind.app?subject=Stillmind%20support">Contact support</a></div>` ,[{label:'Done',primary:true}],'SETTINGS');$('#musicToggle').addEventListener('change',e=>localStorage.setItem('stillmindMusic',e.target.checked?'on':'off'));$('#sfxToggle').addEventListener('change',e=>localStorage.setItem('stillmindSfx',e.target.checked?'on':'off'));document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{applyTheme(b.dataset.themeChoice);document.querySelectorAll('[data-theme-choice]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})}))}
$('#playButton').addEventListener('click',chooseDifficulty);
$('#backButton').addEventListener('click',()=>{saveActiveGame();showHome()});
$('#notesButton').addEventListener('click',()=>{state.notesMode=!state.notesMode;$('#notesState').textContent=state.notesMode?'on':'off';$('#notesButton').classList.toggle('on',state.notesMode);showToast(state.notesMode?'Notes are on.':'Notes are off.')});
$('#mistakesButton').addEventListener('click',()=>{state.checkMistakes=!state.checkMistakes;$('#mistakesState').textContent=state.checkMistakes?'on':'off';$('#mistakesButton').classList.toggle('on',state.checkMistakes);renderBoard();showToast(state.checkMistakes?'Mistake checking is on.':'Mistake checking is off.')});
$('#hintButton').addEventListener('click',teachMe);
$('#eraseButton').addEventListener('click',()=>{if(state.selected===null)return showToast('Choose a square first.');const r=Math.floor(state.selected/9),c=state.selected%9;if(state.puzzle[r][c])return showToast('That number is part of the puzzle.');state.values[r][c]=0;state.notes[state.selected].clear();renderBoard();renderPad();saveActiveGame()});
$('#rulesButton').addEventListener('click',showTutorial);
$('#modalClose').addEventListener('click',()=>$('#modal').close());
$('#resetProgressButton').addEventListener('click',resetProgress);
$('#settingsButton').addEventListener('click',openSettings);
$('#progressTab').addEventListener('click',()=>document.querySelector('.progress-heading').scrollIntoView({behavior:'smooth',block:'center'}));
$('#homeTab').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
window.addEventListener('pagehide',saveActiveGame);
$('#dateLabel').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(new Date());
const hour=new Date().getHours();$('#welcomeTitle').innerHTML=hour<12?'Good morning,<br><em>let’s play.</em>':hour<18?'Good afternoon,<br><em>let’s play.</em>':'Good evening,<br><em>let’s play.</em>';
renderStats();
applyTheme();
