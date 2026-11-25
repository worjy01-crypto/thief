// ==UserScript==
// @name         記憶聖境 自動登入選角
// @namespace    worjy01-crypto
// @version      1.0
// @description  打開遊戲時自動登入、選好角色進入遊戲（帳密只存在這個瀏覽器設定檔的竄改猴裡）
// @match        *://*.hsagame.com/*
// @match        *://hsagame.com/*
// @match        *://msa-h-testing.up.railway.app/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-login.user.js
// @downloadURL  https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-login.user.js
// ==/UserScript==
(async function(){
var REGION='初鐘',MAX_LOGIN=3;
var get=async function(k,d){try{if(typeof GM_getValue==='function')return GM_getValue(k,d);if(typeof GM!=='undefined'&&GM.getValue)return await GM.getValue(k,d);}catch(e){}return d;};
var set=async function(k,v){try{if(typeof GM_setValue==='function')return GM_setValue(k,v);if(typeof GM!=='undefined'&&GM.setValue)return await GM.setValue(k,v);}catch(e){}};
var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
var txt=function(e){return (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim();};
var vis=function(e){return e&&e.getClientRects().length>0;};
var all=function(sel){return [].slice.call(document.querySelectorAll(sel)).filter(vis);};
var btn=function(re,root){return [].slice.call((root||document).querySelectorAll('button,[role=button],a')).filter(function(b){return vis(b)&&re.test(txt(b));})[0]||null;};

/* ---------- 右上角小提示 ---------- */
var say=function(t,keep){var e=document.getElementById('msaLoginTip');if(!e){e=document.createElement('div');e.id='msaLoginTip';e.style.cssText='position:fixed;right:8px;top:8px;z-index:2147483647;background:rgb(40,60,110);color:white;padding:6px 10px;border-radius:6px;font:13px sans-serif;max-width:70vw';document.body.appendChild(e);}e.textContent='自動登入：'+t;clearTimeout(e._t);if(!keep)e._t=setTimeout(function(){e.remove();},8000);};

/* ---------- 設定視窗（輸入帳密 / 選角色） ---------- */
var modal=function(title,build){var old=document.getElementById('msaLoginBox');if(old)old.remove();var w=document.createElement('div');w.id='msaLoginBox';w.style.cssText='position:fixed;left:50%;top:20%;transform:translateX(-50%);z-index:2147483647;background:rgb(25,25,40);color:white;padding:16px;border:2px solid rgb(200,160,80);border-radius:10px;font:15px sans-serif;width:min(360px,90vw);box-shadow:0 4px 20px black';var h=document.createElement('div');h.style.cssText='font-weight:bold;margin-bottom:10px';h.textContent=title;w.appendChild(h);build(w);document.body.appendChild(w);return w;};
var field=function(w,label,type,val){var l=document.createElement('div');l.textContent=label;l.style.margin='6px 0 2px';var i=document.createElement('input');i.type=type;i.value=val||'';i.style.cssText='width:100%;box-sizing:border-box;padding:6px;font-size:15px;color:black;background:white';w.appendChild(l);w.appendChild(i);return i;};
var button=function(w,label,fn){var b=document.createElement('button');b.textContent=label;b.style.cssText='margin:10px 8px 0 0;padding:6px 14px;font-size:15px';b.onclick=fn;w.appendChild(b);return b;};

var askCreds=function(){return new Promise(async function(done){var acc=await get('acc','');modal('這個視窗要自動登入哪個帳號？（只存在這個瀏覽器設定檔）',function(w){var a=field(w,'帳號','text',acc);var p=field(w,'密碼','password','');button(w,'儲存並登入',async function(){if(!a.value.trim()||!p.value){alert('帳號和密碼都要填');return;}await set('acc',a.value.trim());await set('pwd',p.value);w.remove();done(true);});button(w,'這次先不要',function(){w.remove();done(false);});});});};

/* ---------- 把字填進輸入框（讓網頁真的收到） ---------- */
var fill=function(input,value){var proto=Object.getPrototypeOf(input);var d=Object.getOwnPropertyDescriptor(proto,'value')||Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');d.set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};

/* ---------- 判斷現在在哪個畫面 ---------- */
var inGame=function(){return !!document.getElementById('msLv')||/Base\s*\d+/.test((document.getElementById('msLv')||{}).textContent||'');};
var loginForm=function(){var pw=all('input[type=password]')[0];if(!pw)return null;if(!btn(/^登入$/))return null;var texts=all('input').filter(function(i){return i!==pw&&(i.type==='text'||i.type===''||i.type==='email')&&!/邀請/.test(i.placeholder||'');});var acc=null;texts.forEach(function(i){if(acc)return;var lab=i.closest('label');var prev=i.previousElementSibling;var near=(lab?txt(lab):'')+(prev?txt(prev):'')+(i.getAttribute('aria-label')||'')+(i.placeholder||'')+(i.name||'')+(i.id||'');if(/帳號|account|user/i.test(near))acc=i;});if(!acc){acc=texts.filter(function(i){return i.compareDocumentPosition(pw)&Node.DOCUMENT_POSITION_FOLLOWING;}).pop()||null;}return acc?{acc:acc,pwd:pw}:null;};
var charCards=function(){if(!/選擇角色/.test(document.body.innerText))return [];return [].slice.call(document.querySelectorAll('button,[role=button]')).filter(function(b){return vis(b)&&/^進入$/.test(txt(b));}).map(function(b){var c=b;while(c&&c!==document.body&&!/刪除/.test(txt(c)))c=c.parentElement;var lines=((c&&c.innerText)||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s&&!/^(進入|刪除|進入\s*刪除)$/.test(s);});return {btn:b,name:lines[0]||'',info:lines.slice(0,3).join('　')};}).filter(function(x){return x.name;});};

/* ---------- 選角色 ---------- */
var pickChar=async function(cards){var want=await get('char','');var hit=cards.filter(function(c){return c.name===want;})[0];if(hit){say('進入角色「'+want+'」');hit.btn.click();return;}if(document.getElementById('msaLoginBox'))return;modal(want?'找不到角色「'+want+'」，這個視窗要自動進入哪個角色？':'這個視窗要自動進入哪個角色？（之後會記住）',function(w){cards.forEach(function(c){var b=button(w,c.info,async function(){await set('char',c.name);w.remove();say('已記住「'+c.name+'」，進入中');c.btn.click();});b.style.display='block';b.style.width='100%';b.style.textAlign='left';});button(w,'這次我自己選',function(){w.remove();});});};

/* ---------- 登入 ---------- */
var tries=0,lastTry=0,paused=false;
var doLogin=async function(f){
  if(paused||Date.now()-lastTry<15000)return;
  var regionLine=[].slice.call(document.querySelectorAll('body *')).filter(function(e){return vis(e)&&e.children.length<=2&&/^▸?\s*選區[：:]/.test(txt(e));})[0];
  if(regionLine&&txt(regionLine).indexOf(REGION)<0){paused=true;say('選區不是「'+REGION+'」，請手動切換後重新整理',true);return;}
  var acc=await get('acc',''),pwd=await get('pwd','');
  if(!acc||!pwd){paused=true;var ok=await askCreds();paused=false;if(!ok){paused=true;say('這次不自動登入。要設定請點竄改猴選單「設定帳號密碼」',true);return;}acc=await get('acc','');pwd=await get('pwd','');}
  if(tries>=MAX_LOGIN){paused=true;say('已試 '+MAX_LOGIN+' 次都沒登入成功，先停下來。請檢查帳密（竄改猴選單可重設）',true);return;}
  tries++;lastTry=Date.now();
  if(f.acc.value.trim()!==acc){fill(f.acc,acc);say('填入帳號與密碼，登入中（第 '+tries+' 次）');}else{say('帳號已在，只填密碼，登入中（第 '+tries+' 次）');}
  fill(f.pwd,pwd);await sleep(300);
  var b=btn(/^登入$/);if(b)b.click();
};

try{if(typeof GM_registerMenuCommand==='function'){GM_registerMenuCommand('設定帳號密碼',async function(){paused=true;await askCreds();tries=0;paused=false;});GM_registerMenuCommand('重新選擇自動進入的角色',async function(){await set('char','');say('下次到選角色畫面會再問你');});}}catch(e){}

var doneEnter=false;
setInterval(async function(){
  try{
    if(inGame()){doneEnter=true;tries=0;return;}
    var f=loginForm();if(f){doneEnter=false;await doLogin(f);return;}
    var cards=charCards();if(cards.length&&!doneEnter&&!paused){doneEnter=true;await pickChar(cards);setTimeout(function(){if(!inGame())doneEnter=false;},10000);}
  }catch(e){say('錯誤：'+e.message,true);}
},1500);
})();
