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
  puzzle: [], values: [], notes: Array.from({length:81},()=>new Set()), selected: null, gameId: null,
  level: localStorage.getItem('stillmindDifficulty')||'Beginner', notesMode: false, checkMistakes: false, startedAt: Date.now(),
  elapsed: 0, timerInterval: null, toastTimeout: null,
  stats: JSON.parse(localStorage.getItem('stillmindStats') || '{"finished":0,"minutes":0,"streak":0,"lastDay":"","skills":[]}')
};
const collectionUI={view:'album',category:'all'};
const GAME_KEY='stillmindActiveSudoku';
const THEMES=['green','purple','pink','blue','white','black'];
function createGameId(){return `sudoku-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`}
function applyTheme(theme=localStorage.getItem('stillmindTheme')||'green'){const selected=THEMES.includes(theme)?theme:'green';document.documentElement.dataset.theme=selected;localStorage.setItem('stillmindTheme',selected)}
function saveActiveGame(){if(!state.puzzle.length||!state.gameId)return;state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);const snapshot={gameId:state.gameId,level:state.level,puzzle:state.puzzle,values:state.values,notes:state.notes.map(s=>[...s]),selected:state.selected,elapsed:state.elapsed,savedAt:new Date().toISOString()};try{localStorage.setItem(GAME_KEY,JSON.stringify(snapshot))}catch(error){console.warn('Could not save this Sudoku locally.',error)}}
function getSavedGame(){try{const saved=JSON.parse(localStorage.getItem(GAME_KEY)||'null');if(saved?.puzzle?.length===9&&saved?.values?.length===9&&saved.puzzle.every(row=>row.length===9)&&saved.values.every(row=>row.length===9))return saved}catch(error){console.warn('Could not restore the saved Sudoku.',error)}return null}

function saveStats(){localStorage.setItem('stillmindStats',JSON.stringify(state.stats));renderStats()}
function renderStats(){
  $('#puzzlesCount').textContent=state.stats.finished;
  $('#minutesCount').textContent=state.stats.minutes;
  const skills=state.stats.skills.length?state.stats.skills:['Observation','Digit exclusions'];
  $('#skillPills').innerHTML=skills.slice(-3).map(x=>`<span>${x}</span>`).join('');
}
function formatCurrencyChanges(changes={}){
  const earned=Object.entries(changes).filter(([,amount])=>amount>0).map(([currency,amount])=>`${amount} ${amount===1?currency.slice(0,-1):currency}`);
  return earned
}
function formatRewardSummary(transaction){
  const parts=formatCurrencyChanges(transaction.currencyChanges);
  if(transaction.itemsAcquired.length)parts.push(transaction.itemsAcquired.length===1?'a new collectible':`${transaction.itemsAcquired.length} new collectibles`);
  if(transaction.boxesGranted.length)parts.push(transaction.boxesGranted.length===1?'a surprise box':`${transaction.boxesGranted.length} surprise boxes`);
  let summary=parts.length?`You earned ${parts.slice(0,-1).join(', ')}${parts.length>1?' and ':''}${parts.at(-1)}.`:'A reward was added to your collection.';
  if(transaction.firstGameBonus)summary+=' Your first-game bonus is included.';
  if(transaction.milestoneReward)summary+=` You also reached the ${transaction.totalCompletedGames}-game milestone.`;
  return summary;
}
function describeReward(reward){
  if(!reward)return 'A reward';
  if(reward.type==='bundle')return (reward.rewards||[]).map(describeReward).join(' and ');
  if(reward.type==='currency')return `${reward.amount} ${reward.amount===1?reward.currency.slice(0,-1):reward.currency}`;
  if(reward.type==='surpriseBox')return 'a surprise box';
  if(reward.type==='collectible')return reward.item?.name||'a collectible';
  return reward.label||'a reward';
}
function rewardIcon(reward){return reward?.type==='currency'&&reward.currency==='gems'?'◆':reward?.type==='surpriseBox'?'▣':reward?.type==='collectible'?'✿':'●'}
function monthDaysFromKey(key){const [year,month]=key.split('-').map(Number);return new Date(year,month,0).getDate()}
function renderRewardsDashboard(rewards=window.StillmindRewards.getSnapshot()){
  const streak=rewards.daily.currentStreak||0;
  $('#streakCount').textContent=streak;
  $('#streakText').textContent=streak?`${streak} day${streak===1?'':'s'} in a row`:'Your first day starts here';
  $('#activeDaysText').textContent=`${rewards.daily.totalActiveDays||0} total active day${rewards.daily.totalActiveDays===1?'':'s'}`;
  $('#coinBalance').textContent=rewards.currencies.coins;
  $('#gemBalance').textContent=rewards.currencies.gems;
  $('#currencyDisplay').setAttribute('aria-label',`Coins: ${rewards.currencies.coins}. Gems: ${rewards.currencies.gems}. Show currency information.`);

  const now=new Date(),currentMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthRecord=rewards.monthly[currentMonth]||{activeDates:[],milestoneClaims:{}};
  const activeDays=monthRecord.activeDates.length,daysInMonth=monthDaysFromKey(currentMonth),claims=monthRecord.milestoneClaims||{};
  $('#loyaltyMonth').textContent=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(now);
  const track=(milestone,title,count,target,claimed)=>{
    const eligible=milestone==='fifteenDays'?count>=15:count===target;
    const done=Boolean(claimed);
    const status=done?'Claimed':eligible?'Reward ready':`${Math.max(0,(milestone==='fifteenDays'?15:target)-count)} more day${Math.max(0,(milestone==='fifteenDays'?15:target)-count)===1?'':'s'}`;
    const progress=Math.min(100,Math.round(count/(milestone==='fifteenDays'?15:target)*100));
    return `<div class="loyalty-track"><div class="loyalty-track-heading"><b>${title}</b><span>${count} / ${milestone==='fifteenDays'?15:target} days</span></div><div class="loyalty-meter" role="progressbar" aria-label="${title} progress" aria-valuemin="0" aria-valuemax="${milestone==='fifteenDays'?15:target}" aria-valuenow="${Math.min(count,milestone==='fifteenDays'?15:target)}"><span style="width:${progress}%"></span></div><div class="loyalty-track-footer"><span>${status}</span>${eligible&&!done?`<button class="loyalty-claim" data-month-claim="${milestone}" data-month-key="${currentMonth}">Claim reward</button>`:''}</div></div>`
  };
  let pending=[];
  Object.entries(rewards.monthly).forEach(([monthKey,month])=>{
    if(monthKey===currentMonth)return;
    const count=month.activeDates?.length||0,target=monthDaysFromKey(monthKey),claimsForMonth=month.milestoneClaims||{};
    if(count>=15&&!claimsForMonth.fifteenDays)pending.push({monthKey,milestone:'fifteenDays',label:'15-day reward'});
    if(count===target&&!claimsForMonth.fullMonth)pending.push({monthKey,milestone:'fullMonth',label:'full-month reward'});
  });
  const oldClaims=pending.length?`<div class="monthly-claim-list"><p>Previous month rewards ready to claim</p>${pending.map(item=>`<button class="loyalty-claim" data-month-claim="${item.milestone}" data-month-key="${item.monthKey}">${item.label} · ${new Intl.DateTimeFormat(undefined,{month:'short',year:'numeric'}).format(new Date(Number(item.monthKey.slice(0,4)),Number(item.monthKey.slice(5))-1,1))}</button>`).join('')}</div>`:'';
  $('#monthlyRewardsContent').innerHTML=track('fifteenDays','15-day reward',activeDays,15,claims.fifteenDays)+track('fullMonth','Full-month reward',activeDays,daysInMonth,claims.fullMonth)+oldClaims;
  document.querySelectorAll('[data-month-claim]').forEach(button=>button.addEventListener('click',()=>{
    const result=window.StillmindRewards.claimMonthlyMilestone(button.dataset.monthClaim,button.dataset.monthKey,new Date());
    if(!result.applied){showToast(result.reason==='insufficient-funds'?'You do not have enough currency.':'This reward is no longer available.');return}
    const reward=result.record.monthly[button.dataset.monthKey].milestoneClaims[button.dataset.monthClaim].reward;
    showModal('A little loyalty goes a long way.',`<div class="reward-earned"><span class="reward-earned-icon" aria-hidden="true">${rewardIcon(reward)}</span><div><b>Monthly reward claimed</b><p>You received ${describeReward(reward)}.</p></div></div><p>Your monthly progress stays saved on this device.</p>`,[{label:'Lovely',primary:true}],'MONTHLY LOYALTY');
  }));
}
function showDailyReward(claim){
  const cycleLength=window.StillmindRewards.getConfig().dailyCycle.length;
  const reward=claim.reward;
  const extra=reward.type==='surpriseBox'?'<p>Your box is waiting in Collections whenever you’re ready to open it.</p>':reward.type==='collectible'?'<p>This collectible has been added to your personal collection record.</p>':'';
  showModal('A little gift for today',`<div class="reward-earned"><span class="reward-earned-icon" aria-hidden="true">${rewardIcon(reward)}</span><div><b>${reward.label||'Daily reward'}</b><p>${describeReward(reward)} added to your rewards.</p></div></div><p>You’re on Day ${claim.streak} of your current streak and Day ${claim.cycleDay} of the ${cycleLength}-day reward cycle.</p>${extra}`,[{label:'Collect reward',primary:true}],'DAILY REWARD');
}
function escapeHTML(value=''){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function getCollectionItems(rewards=window.StillmindRewards.getSnapshot()){
  const catalog=window.StillmindCollectibleCatalog;
  const ownedById=new Map(rewards.ownedItems.map(item=>[item.itemId,item]));
  const catalogIds=new Set(catalog.items.map(item=>item.id));
  const listed=catalog.items.map(item=>{
    const owned=ownedById.get(item.id);
    return owned?{...item,...owned,id:item.id,name:owned.name||item.name,description:owned.description||item.description,image:owned.image||item.image,symbol:owned.symbol||item.symbol,categories:[...new Set([...(item.categories||[]),...(owned.categories||[])])],owned:true}: {...item,owned:false};
  });
  const archived=rewards.ownedItems.filter(item=>!catalogIds.has(item.itemId)).map(item=>({
    ...item,id:item.itemId,owned:true,description:item.description||'Kept from an earlier reward.',categories:item.categories||[item.category||'special'],symbol:item.symbol||'✦',archived:true
  }));
  return [...listed,...archived];
}
function collectionCategoryMatches(item,category){return category==='all'||(item.categories||[]).includes(category)||item.category===category||(category==='boxRewards'&&item.source==='surprise-box')}
function isCurrentlyAvailable(item,date=new Date()){
  if(item.active===false)return false;
  const today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return (!item.availableFrom||today>=item.availableFrom)&&(!item.availableUntil||today<=item.availableUntil);
}
function formatCollectionDate(value){if(!value)return '';const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(date)}
function collectionSourceName(source){return ({'daily-reward':'Daily reward','game-completion':'Sudoku completion','first-game-bonus':'First-game bonus','game-milestone':'Game milestone','monthly-milestone':'Monthly milestone','shop-purchase':'Sticker shop','free-collectible':'Free collectible','surprise-box':'Surprise box'})[source]||source||'Reward'}
function collectionCard(item,mode='album',balances={coins:0,gems:0}){
  const owned=Boolean(item.owned),recent=owned&&item.acquiredAt&&Date.now()-new Date(item.acquiredAt).getTime()<7*86400000;
  const art=item.image?`<img src="${escapeHTML(item.image)}" alt="" loading="lazy">`:`<span aria-hidden="true">${escapeHTML(item.symbol||'✦')}</span>`;
  const status=owned?`<span class="item-owned-mark" aria-label="Collected">✓</span>`:`<span class="item-locked-mark" aria-label="Not collected">⌑</span>`;
  const rarity=`<span class="rarity-pill rarity-${escapeHTML(item.rarity||'common')}">${escapeHTML(item.rarity||'common')}</span>`;
  const facts=owned?`<p class="item-acquired">${recent?'<b class="new-item">NEW</b> ':''}Collected ${escapeHTML(formatCollectionDate(item.acquiredAt))}</p><p class="item-source">${escapeHTML(collectionSourceName(item.source))}</p><p class="item-source">${escapeHTML(item.collection||'Personal collection')}</p>`:`<p class="item-source">${escapeHTML(item.collection||'Still to discover')}</p>`;
  let action='';
  if(mode==='shop'){
    const available=isCurrentlyAvailable(item),ownedAlready=owned;
    if(ownedAlready)action='<button class="shop-buy-button" disabled>In your album</button>';
    else if(!available)action='<button class="shop-buy-button" disabled>Not available now</button>';
    else if(item.acquisition==='free')action=`<button class="shop-buy-button" data-collect-free="${escapeHTML(item.id)}">Collect free</button>`;
    else if(item.acquisition==='purchase'){
      const currency=item.currency||'coins',price=Number(item.price)||0,sufficient=(balances[currency]||0)>=price;
      action=`<button class="shop-buy-button" data-buy-item="${escapeHTML(item.id)}">${sufficient?`Get for ${price} ${escapeHTML(currency)}`:`Need ${Math.max(0,price-(balances[currency]||0))} more ${escapeHTML(currency)}`}</button>`;
    }else action='<button class="shop-buy-button" disabled>Reward item</button>';
  }
  const boxTag=item.isBox?'<span class="item-box-status">Unopened</span>':'';
  const archivedTag=item.archived?'<span class="item-box-status">Earlier collection</span>':'';
  return `<article class="collectible-card ${owned?'owned':''} ${item.archived?'archived':''}" data-owned="${owned}"><div class="sticker-art ${escapeHTML(item.artStyle||'art-soft')}">${art}${status}${boxTag}${archivedTag}</div><div class="collectible-card-copy"><div class="item-title-row"><h3>${escapeHTML(item.name||'Untitled collectible')}</h3>${rarity}</div><p class="item-description">${escapeHTML(item.description||'A small keepsake for your album.')}</p>${facts}${action}</div></article>`;
}
function renderCollectionHistory(rewards,items){
  const names=new Map(items.map(item=>[item.id,item.name]));
  const history=[...rewards.transactions].reverse();
  if(!history.length)return '<div class="collection-empty"><span>✧</span><h3>Your story starts here</h3><p>Daily rewards, completed puzzles, and collectibles will appear in this timeline.</p></div>';
  return `<div class="history-list">${history.map(transaction=>{
    const acquired=(transaction.itemsAcquired||[]).map(id=>names.get(id)||id);
    const changes=Object.entries(transaction.currencyChanges||{}).map(([currency,amount])=>`${amount>0?'+':''}${amount} ${amount===1?currency.slice(0,-1):currency}`);
    const details=[...changes,...acquired.map(name=>`Collected ${name}`),...(transaction.boxesGranted||[]).map(()=>`A surprise box was added`),...(transaction.boxOpened?['Opened a surprise box']:[])];
    return `<article class="history-entry"><span class="history-icon" aria-hidden="true">${transaction.source==='game-completion'?'◎':transaction.source==='shop-purchase'?'✿':transaction.source==='daily-reward'?'☼':'✧'}</span><div><b>${escapeHTML(transaction.description||'Reward')}</b><p>${escapeHTML(details.join(' · ')||transaction.source||'Reward activity')}</p><time datetime="${escapeHTML(transaction.timestamp)}">${escapeHTML(formatCollectionDate(transaction.timestamp))}</time></div></article>`;
  }).join('')}</div>`;
}
function renderCollectionGallery(items,category){
  if(category!=='monthly')return `<div class="collectible-grid">${items.map(item=>collectionCard(item)).join('')}</div>`;
  const groups=new Map();
  items.forEach(item=>{
    const key=item.month||item.collectionId||item.collection||'other';
    if(!groups.has(key))groups.set(key,{label:item.month?new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(`${item.month}-01T12:00:00`)):item.collection||'Earlier collection',collection:item.collection||'Monthly keepsakes',items:[]});
    groups.get(key).items.push(item);
  });
  const sorted=[...groups.entries()].sort(([a],[b])=>b.localeCompare(a));
  return sorted.map(([,group])=>`<section class="collection-month-group"><div class="collection-month-heading"><h3>${escapeHTML(group.label)}</h3><span>${escapeHTML(group.collection)}</span></div><div class="collectible-grid">${group.items.map(item=>collectionCard(item)).join('')}</div></section>`).join('');
}
function handleCollectionAction(button){
  const item=window.StillmindCollectibleCatalog.items.find(entry=>entry.id===button.dataset.buyItem||entry.id===button.dataset.collectFree);
  if(!item)return;
  const result=item.acquisition==='free'?window.StillmindRewards.claimFreeCollectible(item,`catalog:${item.id}`):window.StillmindRewards.purchaseCollectible(item,item.currency,item.price,`catalog:${item.id}`);
  if(!result.applied){
    if(result.reason==='insufficient-funds')showModal('A little more practice first.','<p>You do not have enough currency for this collectible yet. Daily rewards and completed Sudoku games add more to your wallet.</p>',[{label:'Got it',primary:true}],'SHOP');
    else if(result.reason==='already-owned')showToast('This collectible is already in your album.');
    else showModal('This collectible could not be added.','<p>Your balance and collection were left unchanged. Please try again.</p>',[{label:'Close',primary:true}],'SHOP');
    return;
  }
  showModal('A new keepsake for your shelf.',`<div class="reward-earned"><span class="reward-earned-icon" aria-hidden="true">${escapeHTML(item.symbol||'✦')}</span><div><b>${escapeHTML(item.name)}</b><p>Added to your personal collection.</p></div></div>`,[{label:'Lovely',primary:true}],'NEW COLLECTIBLE');
}
function showBoxOpening(boxId){
  const box=window.StillmindRewards.getSnapshot().boxes.find(item=>item.id===boxId);
  if(!box||box.openedAt){showToast('That surprise box has already been opened.');return}
  showModal('A little surprise for you.',`<div class="box-preview"><span aria-hidden="true">▣</span><div><b>${escapeHTML(box.boxType==='game-milestone'?'Milestone surprise box':'Surprise box')}</b><p>Tap to see what’s tucked inside.</p></div></div><p>Your reward is chosen from this box’s configured reward pool and saved to your collection.</p>`,[{label:'Maybe later'},{label:'Open box',primary:true,onClick:()=>revealSurpriseBox(boxId)}],'SURPRISE BOX');
}
function revealSurpriseBox(boxId){
  const result=window.StillmindRewards.openSurpriseBox(boxId);
  if(!result.applied){
    const message=result.reason==='already-opened'?'This surprise box has already been opened.':result.reason==='storage-error'?'The reward could not be saved. Your box is still unopened.':'This surprise box could not be opened. Your collection was left unchanged.';
    showModal('Your surprise is still safe.',`<p>${message}</p>`,[{label:'Close',primary:true}],'SURPRISE BOX');
    return;
  }
  const prize=result.reward,contents=prize.rewards||[],hasCollectible=contents.some(item=>item.type==='collectible');
  const rewardsMarkup=contents.map(item=>`<div class="box-reveal-item"><span aria-hidden="true">${escapeHTML(item.symbol||'✦')}</span><b>${escapeHTML(item.name||'A surprise reward')}</b></div>`).join('');
  showModal('Look what you found!',`<div class="box-reveal"><div class="box-reveal-items">${rewardsMarkup}</div><p>${escapeHTML(prize.label||'A surprise reward')}</p></div><p>Your reward is now saved in your wallet or personal album.</p>`,[{label:'Lovely',primary:true,onClick:()=>{collectionUI.view='album';collectionUI.category=hasCollectible?'boxRewards':'all';renderCollectionScreen()}}],'SURPRISE REVEAL');
}
function renderCollectionScreen(rewards=window.StillmindRewards.getSnapshot()){
  const catalog=window.StillmindCollectibleCatalog,items=getCollectionItems(rewards),ownedCount=rewards.ownedItems.length,total=items.length;
  const completion=total?Math.min(100,Math.round(ownedCount/total*100)):0;
  $('#collectionSummary').innerHTML=`<div class="collection-stat"><span>Collected</span><b>${ownedCount}</b><small>unique keepsakes</small></div><div class="collection-stat collection-completion"><span>Album complete</span><b>${completion}%</b><div class="collection-progress" role="progressbar" aria-label="Collection completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion}"><span style="width:${completion}%"></span></div><small>${Math.min(ownedCount,total)} of ${total} designs</small></div><div class="collection-stat"><span>Unopened boxes</span><b>${rewards.boxes.filter(box=>!box.openedAt).length}</b><small>waiting to surprise you</small></div>`;
  document.querySelectorAll('[data-collection-view]').forEach(button=>{const active=button.dataset.collectionView===collectionUI.view;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  $('#shopButton').textContent=collectionUI.view==='shop'?'Back to my album':'Sticker shop ↗';
  $('#shopButton').classList.toggle('active',collectionUI.view==='shop');
  $('#shopButton').setAttribute('aria-pressed',String(collectionUI.view==='shop'));
  const categoryWrap=$('#collectionCategories');
  categoryWrap.classList.toggle('hidden',collectionUI.view==='history');
  categoryWrap.innerHTML=collectionUI.view==='history'?'':catalog.categories.map(category=>`<button class="category-chip ${collectionUI.category===category.id?'active':''}" data-collection-category="${escapeHTML(category.id)}" aria-pressed="${collectionUI.category===category.id}">${escapeHTML(category.label)}</button>`).join('');
  let content='';
  if(collectionUI.view==='history')content=renderCollectionHistory(rewards,items);
  else if(collectionUI.view==='shop'){
    const shopItems=items.filter(item=>['purchase','free'].includes(item.acquisition)&&isCurrentlyAvailable(item)&&collectionCategoryMatches(item,collectionUI.category));
    content=shopItems.length?`<div class="collection-intro"><h2>Choose a little keepsake</h2><p>Use coins or gems you’ve earned in Stillmind. No real-money purchases.</p></div><div class="collectible-grid">${shopItems.map(item=>collectionCard(item,'shop',rewards.currencies)).join('')}</div>`:'<div class="collection-empty"><span>✧</span><h3>Nothing in this shop shelf yet</h3><p>Try another category or check back when new designs arrive.</p></div>';
  }else{
    const visible=items.filter(item=>collectionCategoryMatches(item,collectionUI.category));
    const boxes=collectionUI.category==='all'||collectionUI.category==='boxRewards'?rewards.boxes.filter(box=>!box.openedAt):[];
    content=`<div class="collection-intro"><h2>${escapeHTML(catalog.categories.find(category=>category.id===collectionUI.category)?.label||'All Items')}</h2><p>Keep the little things you’ve earned, all in one place.</p></div>${visible.length?renderCollectionGallery(visible,collectionUI.category):'<div class="collection-empty"><span>✧</span><h3>No designs in this shelf yet</h3><p>Choose another category or visit the Sticker Shop to find a new favorite.</p></div>'}${boxes.length?`<section class="box-shelf"><div><p class="eyebrow">A LITTLE MYSTERY</p><h2>Surprise boxes</h2><p>Open a box to reveal coins, gems, or a collectible for your album.</p></div><div class="box-shelf-items">${boxes.map(box=>`<article class="unopened-box"><span aria-hidden="true">▣</span><div><b>${escapeHTML(box.boxType==='game-milestone'?'Milestone box':'Surprise box')}</b><small>Earned ${escapeHTML(formatCollectionDate(box.acquiredAt))}</small></div><button class="open-box-button" data-open-box="${escapeHTML(box.id)}" aria-label="Open ${escapeHTML(box.boxType==='game-milestone'?'milestone':'surprise')} box">Open</button></article>`).join('')}</div></section>`:''}`;
  }
  $('#collectionContent').innerHTML=content;
  document.querySelectorAll('[data-collection-view]').forEach(button=>button.onclick=()=>{collectionUI.view=button.dataset.collectionView;renderCollectionScreen()});
  document.querySelectorAll('[data-collection-category]').forEach(button=>button.onclick=()=>{collectionUI.category=button.dataset.collectionCategory;renderCollectionScreen()});
  document.querySelectorAll('[data-buy-item],[data-collect-free]').forEach(button=>button.onclick=()=>handleCollectionAction(button));
  document.querySelectorAll('[data-open-box]').forEach(button=>button.onclick=()=>showBoxOpening(button.dataset.openBox));
}
function showCollections(){clearInterval(state.timerInterval);state.timerInterval=null;$('#homeScreen').classList.add('hidden');$('#gameScreen').classList.add('hidden');$('#collectionsScreen').classList.remove('hidden');$('.bottom-nav').classList.remove('hidden');$('.nav-item').forEach(button=>button.classList.toggle('active',button.id==='collectionsTab'));renderCollectionScreen()}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(state.toastTimeout);state.toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
function showModal(title,body,actions=[],eyebrow='A GENTLE START'){
  $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modalEyebrow').textContent=eyebrow;
  const wrap=$('#modalActions');wrap.innerHTML='';
  actions.forEach(({label,primary,onClick})=>{const b=document.createElement('button');b.className=primary?'primary-button':'secondary-button';b.textContent=label;b.onclick=()=>{$('#modal').close();if(onClick)onClick()};wrap.appendChild(b)});
  $('#modal').showModal();
}
function showHome(){clearInterval(state.timerInterval);state.timerInterval=null;$('#homeScreen').classList.remove('hidden');$('#gameScreen').classList.add('hidden');$('#collectionsScreen').classList.add('hidden');$('.bottom-nav').classList.remove('hidden');$('.nav-item').forEach(b=>b.classList.toggle('active',b.id==='homeTab'));renderStats();renderRewardsDashboard()}
function startGame(level=state.level){
  if(!PUZZLES[level])level='Beginner';
  state.level=level;state.puzzle=PUZZLES[level].map(row=>row.slice());state.values=PUZZLES[level].map(row=>row.slice());
  localStorage.setItem('stillmindDifficulty',level);
  state.notes=Array.from({length:81},()=>new Set());state.selected=null;state.gameId=createGameId();state.elapsed=0;state.startedAt=Date.now();
  $('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('#collectionsScreen').classList.add('hidden');$('.bottom-nav').classList.add('hidden');
  document.querySelectorAll('.difficulty-switch button').forEach(b=>b.classList.toggle('active',b.dataset.level===level));
  $('#notesState').textContent=state.notesMode?'on':'off';$('#mistakesState').textContent=state.checkMistakes?'on':'off';
  $('#notesButton').classList.toggle('on',state.notesMode);$('#mistakesButton').classList.toggle('on',state.checkMistakes);
  renderBoard();renderPad();clearInterval(state.timerInterval);state.timerInterval=setInterval(updateTimer,1000);updateTimer();saveActiveGame();
}
function resumeGame(saved=getSavedGame()){if(!saved)return startGame(state.level);state.level=saved.level||'Beginner';state.puzzle=saved.puzzle;state.values=saved.values;state.notes=(saved.notes||Array.from({length:81},()=>[])).map(s=>new Set(s));state.selected=saved.selected??null;state.gameId=saved.gameId||createGameId();state.elapsed=saved.elapsed||0;state.startedAt=Date.now()-state.elapsed*1000;$('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('#collectionsScreen').classList.add('hidden');$('.bottom-nav').classList.add('hidden');renderBoard();renderPad();clearInterval(state.timerInterval);state.timerInterval=setInterval(updateTimer,1000);updateTimer();saveActiveGame()}
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
    const idx=cellIndex(r,c),v=state.values[r][c],el=document.createElement('button');el.className='cell';el.setAttribute('role','gridcell');el.setAttribute('aria-label',`Row ${r+1}, column ${c+1}${v?`, ${v}`:''}`);el.setAttribute('aria-selected',String(state.selected===idx));el.dataset.index=idx;
    if(state.puzzle[r][c])el.classList.add('given');
    if(state.selected===idx)el.classList.add('selected');
    if(state.selected!==null){const sr=Math.floor(state.selected/9),sc=state.selected%9,sv=state.values[sr][sc];if((sr===r||sc===c||(Math.floor(sr/3)===Math.floor(r/3)&&Math.floor(sc/3)===Math.floor(c/3)))&&idx!==state.selected)el.classList.add('peer');if(sv&&v===sv&&idx!==state.selected)el.classList.add('same-number')}
    if(v){el.textContent=v;if(state.checkMistakes&&v!==SOLUTION[r][c]&&!state.puzzle[r][c])el.classList.add('mistake')}
    else if(state.notes[idx].size){const note=document.createElement('span');note.className='notes';note.innerHTML=[1,2,3,4,5,6,7,8,9].map(n=>`<span>${state.notes[idx].has(n)?n:''}</span>`).join('');el.appendChild(note)}
    el.addEventListener('click',()=>{
      const selectedValue=state.selected===null?0:state.values[Math.floor(state.selected/9)][state.selected%9];
      state.selected=v&&selectedValue===v?null:idx;
      renderBoard();saveActiveGame()
    });board.appendChild(el)
  }
}
function renderPad(){const pad=$('#numberPad');pad.innerHTML='';for(let n=1;n<=9;n++){const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-label',`Enter ${n}`);const count=state.values.flat().filter(v=>v===n).length;b.disabled=count>=9;b.onclick=()=>enterNumber(n);pad.appendChild(b)}}
document.addEventListener('click',event=>{
  if(state.selected===null)return;
  const selectedValue=state.values[Math.floor(state.selected/9)][state.selected%9];
  if(!selectedValue)return;
  const clickedCell=event.target.closest('.cell');
  if(clickedCell&&Number(clickedCell.dataset.index)===state.selected)return;
  state.selected=null;renderBoard();saveActiveGame();
});
function enterNumber(n){
  if(state.selected===null){showToast('Choose a square first.');return}
  const r=Math.floor(state.selected/9),c=state.selected%9;if(state.puzzle[r][c]){showToast('That number is part of the puzzle.');return}
  if(state.notesMode&&!state.values[r][c]){state.notes[state.selected].has(n)?state.notes[state.selected].delete(n):state.notes[state.selected].add(n)}else{state.values[r][c]=n;state.notes[state.selected].clear()}
  renderBoard();renderPad();saveActiveGame();if(state.values.flat().every(Boolean))finishGame()
}
function finishGame(){
  const wrong=state.values.some((row,r)=>row.some((v,c)=>v!==SOLUTION[r][c]));
  if(wrong){showToast('A few numbers need another look. Turn on mistake check or ask for a hint.');return}
  const completedGameId=state.gameId||createGameId();
  const rewardResult=window.StillmindRewards.recordGameCompletion(completedGameId,state.level);
  const transaction=rewardResult.applied?rewardResult.record?.transactions.find(item=>item.id===`game:${completedGameId}`):null;
  const rewardSummary=transaction?formatRewardSummary(transaction):rewardResult.reason==='storage-error'?'Your puzzle is complete, but the rewards could not be saved on this device.':'Your game rewards were already recorded.';
  clearInterval(state.timerInterval);state.timerInterval=null;state.gameId=null;localStorage.removeItem(GAME_KEY);state.stats.finished++;state.stats.minutes+=Math.max(1,Math.round(state.elapsed/60));
  saveStats();showModal('You did it, at your pace.','<p>Beautiful work. You completed a Sudoku and gave your mind a little room to grow.</p><div class="reward-earned"><span class="reward-earned-icon" aria-hidden="true">✧</span><div><b>Game reward</b><p>'+rewardSummary+'</p></div></div><div class="hint-callout">Time spent: '+$('#timer').textContent+'. Your progress is saved on this device.</div>',[{label:'Back to today',primary:true,onClick:showHome}], 'A MOMENT TO CELEBRATE');
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
  // Fixed teaching example kept entirely separate from the active game state.
  const tutorialBoard = [
    [5,3,4,6,7,8,9,1,0],
    [6,0,2,0,9,0,3,0,0],
    [0,9,0,0,4,2,5,0,7],
    [8,5,9,7,6,1,0,2,3],
    [4,2,6,8,0,3,7,0,0],
    [7,1,3,9,2,4,0,5,6],
    [0,6,1,5,3,0,2,8,4],
    [0,8,7,0,1,9,6,0,0],
    [3,4,5,2,8,6,1,0,9]
  ];
  const steps=[
    {title:'Introduction to Sudoku',focus:'all',label:'Sudoku is played on a 9×9 grid. Fill each empty cell with a number from 1 through 9. Every row, column, and 3×3 square must contain each number exactly once, with no repeats.'},
    {title:'Understanding rows',focus:'row',label:'Every row must contain each number from 1 through 9 without repeats. Row 1 already has 5, 3, 4, 6, 7, 8, 9, and 1. The only missing number is 2. Scan across the row to spot it.'},
    {title:'Understanding columns',focus:'column',label:'Every column must also contain each number from 1 through 9 without repeats. Column 3 contains 4, 2, 9, 6, 3, 1, 7, and 5. The only missing number is 8. Scan from top to bottom to find it.'},
    {title:'Understanding 3×3 squares',focus:'box',label:'Each 3×3 square must contain every number from 1 through 9 exactly once. In the centre square, rows 4 through 6 and columns 4 through 6, the top row contains 7, 6, and 1; the middle row contains 8 and 3; and the bottom row contains 9, 2, and 4. The missing number is 5. Use this same rule for all nine squares.'},
    {title:'Need a hand? Try Teach Me',focus:'teach',label:'Need more help while solving? Use Teach Me! It offers hints, tips, and guidance for your current Sudoku. It can help you understand what to look for, identify possible moves, and learn new techniques when you get stuck. This tutorial teaches the basic rules; Teach Me helps you apply them during actual gameplay.'},
    {title:'You’re ready to play!',focus:'none',label:'Remember to check the row, column, and 3×3 square before placing a number. Use logical elimination, and remember that Teach Me is available whenever you need additional help.'}
  ];
  let step=0;
  clearInterval(state.timerInterval);
  state.timerInterval=null;
  state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);
  $('#timer').textContent=`${String(Math.floor(state.elapsed/60)).padStart(2,'0')}:${String(state.elapsed%60).padStart(2,'0')}`;
  saveActiveGame();
  const boardMarkup=(focus)=>`<div class="tutorial-board focus-${focus}" role="grid" aria-label="Read-only fixed Sudoku tutorial board">${tutorialBoard.flatMap((row,r)=>row.map((value,c)=>{
    const classes=['tutorial-cell'];
    if(focus==='all')classes.push('focus-all');
    if(focus==='row'&&r===0)classes.push('focus-row-cell');
    if(focus==='column'&&c===2)classes.push('focus-column-cell');
    if(focus==='box'&&r>=3&&r<6&&c>=3&&c<6)classes.push('focus-box-cell');
    const shown=value===0?'':value;
    const label=value===0?`Row ${r+1}, column ${c+1}, empty`:`Row ${r+1}, column ${c+1}, ${value}`;
    return `<span class="${classes.join(' ')}" role="gridcell" aria-label="${label}">${shown}</span>`;
  })).join('')}</div>`;
  const present=()=>{
    const item=steps[step],last=step===steps.length-1;
    const content=`<div class="tutorial-progress" role="progressbar" aria-label="Tutorial progress" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${step+1}"><span style="width:${((step+1)/steps.length)*100}%"></span></div>${boardMarkup(item.focus)}<p class="tutorial-caption">${item.label}</p>`;
    const actions=[];
    if(step>0)actions.push({label:'Back',onClick:()=>{step--;present()}});
    actions.push({label:last?'Start Playing':'Next',primary:true,onClick:()=>{if(last){$('#hintButton').classList.remove('tutorial-target');return}step++;present()}});
    $('#hintButton').classList.toggle('tutorial-target',step===4);
    showModal(item.title,content,actions,`SUDOKU WALKTHROUGH · STEP ${step+1} OF ${steps.length}`);
  };
  const modal=$('#modal');
  const clearTeachHighlight=()=>{if(!modal.open){
    $('#hintButton').classList.remove('tutorial-target');
    state.startedAt=Date.now()-state.elapsed*1000;
    if(!$('#gameScreen').classList.contains('hidden'))state.timerInterval=setInterval(updateTimer,1000);
    modal.removeEventListener('close',clearTeachHighlight);
  }};
  modal.addEventListener('close',clearTeachHighlight);
  present();
}
function resetProgress(){showModal('A fresh start, whenever you need one.','<p>Progress is only saved on this device. If you’re moving to a new phone, you can begin again with a short skill check to find a comfortable level.</p><p>This clears your Sudoku totals. Your daily reward streak, currency, and collection history stay saved.</p>',[{label:'Keep my progress',onClick:()=>{}},{label:'Clear Sudoku totals',primary:true,onClick:()=>{localStorage.removeItem('stillmindStats');state.stats={finished:0,minutes:0,streak:0,lastDay:'',skills:[]};saveStats();showToast('Your Sudoku totals have been cleared.')}}],'YOUR PROGRESS');}
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
$('#currencyDisplay').addEventListener('click',()=>showModal('Your little reward wallet.','<p><b>Coins</b> are the everyday reward currency. Earn them through daily visits and completed Sudoku games, then use them for standard collectibles.</p><p><b>Gems</b> are less common. Earn them through daily and milestone rewards, then save them for special collectibles.</p><p>Your balances are saved only in this browser on this device. There are no real-money purchases.</p>',[{label:'Got it',primary:true}],'COINS & GEMS'));
$('#collectionsTab').addEventListener('click',showCollections);
$('#shopButton').addEventListener('click',()=>{collectionUI.view=collectionUI.view==='shop'?'album':'shop';renderCollectionScreen()});
$('#progressTab').addEventListener('click',()=>{showHome();document.querySelector('.progress-heading').scrollIntoView({behavior:'smooth',block:'center'})});
$('#homeTab').addEventListener('click',()=>{showHome();window.scrollTo({top:0,behavior:'smooth'})});
window.addEventListener('pagehide',saveActiveGame);
$('#dateLabel').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(new Date());
const hour=new Date().getHours();$('#welcomeTitle').innerHTML=hour<12?'Good morning,<br><em>let’s play.</em>':hour<18?'Good afternoon,<br><em>let’s play.</em>':'Good evening,<br><em>let’s play.</em>';
renderStats();
applyTheme();
window.StillmindRewards.subscribe(rewards=>{
  renderRewardsDashboard(rewards);
  if(!$('#collectionsScreen').classList.contains('hidden'))renderCollectionScreen(rewards);
});
window.StillmindRewards.preserveLegacyGameHistory(state.stats.finished);
const todayReward=window.StillmindRewards.claimDailyReward(new Date());
if(todayReward.applied)showDailyReward(todayReward.claim);
else if(todayReward.reason==='storage-error')showModal('Your daily reward could not be saved.','<p>This browser could not save your reward data. Check that local storage is available, then try again later.</p>',[{label:'Continue',primary:true}],'LOCAL STORAGE');
