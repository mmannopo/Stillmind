const SOLUTION = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
];
const PUZZLES = {
  Gentle: [
    [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
  ],
  Steady: [
    [0,0,0,0,0,0,0,1,2],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,5,6,0],
    [0,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,0],
    [0,6,0,0,0,0,0,0,0],[0,0,0,0,0,9,0,0,0],[3,4,0,0,0,0,0,0,0]
  ],
  Spicy: [
    [0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,5,0,0],
    [0,0,0,0,6,0,0,0,0],[4,0,0,0,0,0,0,0,1],[0,0,0,0,2,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
  ]
};
const $ = (s) => document.querySelector(s);
const state = {
  puzzle: [], values: [], notes: Array.from({length:81},()=>new Set()), selected: null,
  level: 'Gentle', notesMode: false, checkMistakes: false, startedAt: Date.now(),
  elapsed: 0, timerInterval: null, toastTimeout: null,
  stats: JSON.parse(localStorage.getItem('stillmindStats') || '{"finished":0,"minutes":0,"streak":0,"lastDay":"","skills":[]}')
};

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
  state.level=level;state.puzzle=PUZZLES[level].map(row=>row.slice());state.values=PUZZLES[level].map(row=>row.slice());
  state.notes=Array.from({length:81},()=>new Set());state.selected=null;state.elapsed=0;state.startedAt=Date.now();
  $('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('.bottom-nav').classList.add('hidden');
  document.querySelectorAll('.difficulty-switch button').forEach(b=>b.classList.toggle('active',b.dataset.level===level));
  $('#notesState').textContent=state.notesMode?'on':'off';$('#mistakesState').textContent=state.checkMistakes?'on':'off';
  $('#notesButton').classList.toggle('on',state.notesMode);$('#mistakesButton').classList.toggle('on',state.checkMistakes);
  renderBoard();renderPad();clearInterval(state.timerInterval);state.timerInterval=setInterval(updateTimer,1000);updateTimer();
}
function updateTimer(){state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);$('#timer').textContent=`${String(Math.floor(state.elapsed/60)).padStart(2,'0')}:${String(state.elapsed%60).padStart(2,'0')}`}
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
    el.addEventListener('click',()=>{state.selected=idx;renderBoard()});board.appendChild(el)
  }
}
function renderPad(){const pad=$('#numberPad');pad.innerHTML='';for(let n=1;n<=9;n++){const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-label',`Enter ${n}`);const count=state.values.flat().filter(v=>v===n).length;b.disabled=count>=9;b.onclick=()=>enterNumber(n);pad.appendChild(b)}}
function enterNumber(n){
  if(state.selected===null){showToast('Choose a square first.');return}
  const r=Math.floor(state.selected/9),c=state.selected%9;if(state.puzzle[r][c]){showToast('That number is part of the puzzle.');return}
  if(state.notesMode&&!state.values[r][c]){state.notes[state.selected].has(n)?state.notes[state.selected].delete(n):state.notes[state.selected].add(n)}else{state.values[r][c]=n;state.notes[state.selected].clear()}
  renderBoard();renderPad();if(state.values.flat().every(Boolean))finishGame()
}
function finishGame(){
  const wrong=state.values.some((row,r)=>row.some((v,c)=>v!==SOLUTION[r][c]));
  if(wrong){showToast('A few numbers need another look. Turn on mistake check or ask for a hint.');return}
  clearInterval(state.timerInterval);state.stats.finished++;state.stats.minutes+=Math.max(1,Math.round(state.elapsed/60));
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
    showModal('A number has only one place to go.',`<p>Look at <b>row ${h.r+1}, column ${h.c+1}</b>.</p><div class="hint-callout">${h.n} is the only number that can fit here. The other digits are already used in this square’s row, column, or 3×3 box.</div><p class="hint-step">This is called a <b>naked single</b>—a great first pattern to learn.</p>`,[{label:'Place '+h.n,primary:true,onClick:()=>{state.values[h.r][h.c]=h.n;renderBoard();renderPad();if(state.values.flat().every(Boolean))finishGame()}},{label:'I’ll try myself'}],'SUDOKU LESSON');
  }else{
    showModal('Let’s scan the possibilities.',`<p>We’ve highlighted <b>row ${h.r+1}, column ${h.c+1}</b> because it has one of the fewest open choices right now.</p><div class="hint-callout">The possible digits here are <b>${h.candidates.join(', ')}</b>. Each filled number in the same row, column, and 3×3 box rules out a candidate.</div><p class="hint-step">Try scanning one digit at a time across the highlighted row or box. We’ll add deeper pattern lessons as your practice grows.</p>`,[{label:'Got it',primary:true}],'SUDOKU LESSON');
  }
}
function showTutorial(){showModal('Sudoku, without the pressure.','<p>Fill every row, column, and 3×3 box with the numbers 1 through 9. Each number appears once in each.</p><ul><li>Tap an empty square, then choose a number.</li><li>Turn on <b>Notes</b> to pencil in possibilities.</li><li>Ask <b>Teach me</b> for a gentle, board-aware hint.</li></ul><p>Your progress stays on this device.</p>',[{label:'Show me the basics',primary:true,onClick:()=>showModal('Start with what’s missing.','<p>Look across a row, down a column, or inside a 3×3 box. If eight numbers are already there, the missing one has only one place to go.</p><div class="hint-callout">You can turn on mistake checking or ask for a lesson whenever you feel stuck.</div>',[{label:'Let’s play',primary:true,onClick:()=>startGame()}],'YOUR FIRST PATTERN')},{label:'Skip tutorial',onClick:()=>startGame()}]);}
function resetProgress(){showModal('A fresh start, whenever you need one.','<p>Progress is only saved on this device. If you’re moving to a new phone, you can begin again with a short skill check to find a comfortable level.</p><p>This will clear your local streak and puzzle totals.</p>',[{label:'Keep my progress',onClick:()=>{}},{label:'Clear progress',primary:true,onClick:()=>{localStorage.removeItem('stillmindStats');state.stats={finished:0,minutes:0,streak:0,lastDay:'',skills:[]};saveStats();showToast('Your local progress has been cleared.')}}],'YOUR PROGRESS');}
function showRules(){showModal('A few rules, then you’re off.','<p>Fill each row, column, and 3×3 box with digits 1–9. A digit can only appear once in each.</p><p><b>Notes</b> help you keep track of candidates. <b>Check mistakes</b> highlights entries that don’t match this puzzle’s solution. <b>Teach me</b> explains a real deduction when one is available.</p>',[{label:'Got it',primary:true}],'SUDOKU BASICS')}

$('#playButton').addEventListener('click',()=>showTutorial());
$('#backButton').addEventListener('click',showHome);
$('#notesButton').addEventListener('click',()=>{state.notesMode=!state.notesMode;$('#notesState').textContent=state.notesMode?'on':'off';$('#notesButton').classList.toggle('on',state.notesMode);showToast(state.notesMode?'Notes are on.':'Notes are off.')});
$('#mistakesButton').addEventListener('click',()=>{state.checkMistakes=!state.checkMistakes;$('#mistakesState').textContent=state.checkMistakes?'on':'off';$('#mistakesButton').classList.toggle('on',state.checkMistakes);renderBoard();showToast(state.checkMistakes?'Mistake checking is on.':'Mistake checking is off.')});
$('#hintButton').addEventListener('click',teachMe);
$('#eraseButton').addEventListener('click',()=>{if(state.selected===null)return showToast('Choose a square first.');const r=Math.floor(state.selected/9),c=state.selected%9;if(state.puzzle[r][c])return showToast('That number is part of the puzzle.');state.values[r][c]=0;state.notes[state.selected].clear();renderBoard();renderPad()});
$('#rulesButton').addEventListener('click',showRules);
$('#modalClose').addEventListener('click',()=>$('#modal').close());
$('#resetProgressButton').addEventListener('click',resetProgress);
$('#profileButton').addEventListener('click',()=>{showHome();document.querySelector('.progress-heading').scrollIntoView({behavior:'smooth',block:'center'})});
$('#progressTab').addEventListener('click',()=>document.querySelector('.progress-heading').scrollIntoView({behavior:'smooth',block:'center'}));
$('#homeTab').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
document.querySelectorAll('.difficulty-switch button').forEach(button=>button.addEventListener('click',()=>{
  const level=button.dataset.level;if(level===state.level)return;
  showModal(`Switch to ${level.toLowerCase()}?`,'<p>Starting a different difficulty will begin a new puzzle. Your other practice stays in your progress.</p>',[{label:'Keep this puzzle'},{label:'Start new puzzle',primary:true,onClick:()=>startGame(level)}],'CHOOSE YOUR PACE');
}));
$('#dateLabel').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(new Date());
const hour=new Date().getHours();$('#welcomeTitle').innerHTML=hour<12?'Good morning,<br><em>let’s play.</em>':hour<18?'Good afternoon,<br><em>let’s play.</em>':'Good evening,<br><em>let’s play.</em>';
renderStats();
