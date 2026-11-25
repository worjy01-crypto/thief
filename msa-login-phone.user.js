// ==UserScript==
// @name         記憶聖境 手機快速切換帳號
// @namespace    worjy01-crypto
// @version      1.3
// @description  登入畫面跳出帳號清單，點一下自動登入並進入該帳號記住的角色（帳密只存在這支手機）
// @match        *://*.hsagame.com/*
// @match        *://hsagame.com/*
// @match        *://msa-h-testing.up.railway.app/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-login-phone.user.js
// @downloadURL  https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-login-phone.user.js
// ==/UserScript==
(async function(){
var get=async function(k,d){try{if(typeof GM!=='undefined'&&GM.getValue)return await GM.getValue(k,d);if(typeof GM_getValue==='function')return GM_getValue(k,d);}catch(e){}return d;};
var set=async function(k,v){try{if(typeof GM!=='undefined'&&GM.setValue)return await GM.setValue(k,v);if(typeof GM_setValue==='function')return GM_setValue(k,v);}catch(e){}};
var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
var txt=function(e){return (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim();};
var vis=function(e){return e&&e.getClientRects().length>0;};
var all=function(sel){return [].slice.call(document.querySelectorAll(sel)).filter(vis);};
var btn=function(re){return [].slice.call(document.querySelectorAll('button,[role=button],a')).filter(function(b){return vis(b)&&re.test(txt(b));})[0]||null;};
var load=async function(){var a=await get('accounts','[]');try{a=typeof a==='string'?JSON.parse(a):a;}catch(e){a=[];}return Array.isArray(a)?a:[];};
var save=async function(a){await set('accounts',JSON.stringify(a));};
/* 這個分頁目前選的帳號（每個無痕分頁各自記） */
var mark=function(){var m=/[#&]msa=([^&]+)/.exec(location.hash||'');return m?decodeURIComponent(m[1]):'';};var cur=function(v){if(v!==undefined){try{sessionStorage.setItem('msaCurAcc',v);}catch(e){}try{history.replaceState(null,'',location.pathname+location.search+'#msa='+encodeURIComponent(v));}catch(e){}}var m=mark();if(m){try{sessionStorage.setItem('msaCurAcc',m);}catch(e){}return m;}var s='';try{s=sessionStorage.getItem('msaCurAcc')||'';}catch(e){}return s;};

var say=function(t){var e=document.getElementById('msaPhTip');if(!e){e=document.createElement('div');e.id='msaPhTip';e.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:rgb(40,60,110);color:white;padding:8px 10px;border-radius:8px;font:15px sans-serif;text-align:center';document.body.appendChild(e);}e.textContent=t;clearTimeout(e._t);e._t=setTimeout(function(){e.remove();},5000);};
var box=function(title){var old=document.getElementById('msaPhBox');if(old)old.remove();var w=document.createElement('div');w.id='msaPhBox';w.style.cssText='position:fixed;left:12px;right:12px;bottom:90px;z-index:2147483647;background:rgb(25,25,40);color:white;padding:14px;border:2px solid rgb(200,160,80);border-radius:12px;font:16px sans-serif;max-height:60vh;overflow:auto;box-shadow:0 4px 20px black';var h=document.createElement('div');h.style.cssText='font-weight:bold;margin-bottom:8px';h.textContent=title;w.appendChild(h);document.body.appendChild(w);return w;};
var bigBtn=function(w,label,fn,color){var b=document.createElement('button');b.textContent=label;b.style.cssText='display:block;width:100%;margin:6px 0;padding:12px;font-size:16px;border-radius:8px;border:0;color:white;background:'+(color||'rgb(90,70,140)');b.onclick=fn;w.appendChild(b);return b;};
var input=function(w,label,type){var l=document.createElement('div');l.textContent=label;l.style.margin='6px 0 2px';var i=document.createElement('input');i.type=type;i.autocapitalize='off';i.autocomplete='off';i.style.cssText='width:100%;box-sizing:border-box;padding:10px;font-size:16px;color:black;background:white;border-radius:6px';w.appendChild(l);w.appendChild(i);return i;};
var fill=function(el,v){var d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value')||Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');d.set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};

var loginForm=function(){var pw=all('input[type=password]')[0];if(!pw||!btn(/^登入$/))return null;var texts=all('input').filter(function(i){return i!==pw&&(i.type==='text'||i.type==='')&&!/邀請/.test(i.placeholder||'');});var acc=texts.filter(function(i){return i.compareDocumentPosition(pw)&Node.DOCUMENT_POSITION_FOLLOWING;}).pop()||null;return acc?{acc:acc,pwd:pw}:null;};
var inGame=function(){return !!document.getElementById('msLv');};
var cards=function(){if(!/選擇角色/.test(document.body.innerText))return [];return [].slice.call(document.querySelectorAll('button,[role=button]')).filter(function(b){return vis(b)&&/^進入$/.test(txt(b));}).map(function(b){var c=b;while(c&&c!==document.body&&!/刪除/.test(txt(c)))c=c.parentElement;var lines=((c&&c.innerText)||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s&&!/^(進入|刪除|進入\s*刪除)$/.test(s);});return {btn:b,name:lines[0]||'',info:lines.slice(0,2).join('　')};}).filter(function(x){return x.name;});};

var addAccount=async function(){var w=box('新增帳號（只存在這支手機）');var a=input(w,'帳號','text');var p=input(w,'密碼','password');bigBtn(w,'儲存',async function(){if(!a.value.trim()||!p.value){alert('帳號和密碼都要填');return;}var list=await load();list=list.filter(function(x){return x.acc!==a.value.trim();});list.push({acc:a.value.trim(),pwd:p.value,char:''});await save(list);w.remove();shown=false;});bigBtn(w,'取消',function(){w.remove();shown=false;},'rgb(70,70,80)');};
var manage=async function(){var list=await load();var w=box('刪除帳號');list.forEach(function(x){bigBtn(w,'刪除 '+x.acc,async function(){if(!confirm('確定刪除 '+x.acc+'？'))return;await save(list.filter(function(y){return y.acc!==x.acc;}));w.remove();shown=false;},'rgb(140,50,50)');});bigBtn(w,'返回',function(){w.remove();shown=false;},'rgb(70,70,80)');};

var shown=false,busy=false;
var tries=0;var autoLogin=async function(f){var acc=cur();if(!acc)return false;var list=await load();var me=list.filter(function(x){return x.acc===acc;})[0];if(!me)return false;if(tries>=3){return false;}tries++;busy=true;fill(f.acc,me.acc);fill(f.pwd,me.pwd);await sleep(300);var b=btn(/^登入$/);if(b)b.click();say('自動重新登入 '+acc+'（第 '+tries+' 次）');setTimeout(function(){busy=false;},8000);return true;};var openAll=async function(){var list=await load();var w=box('一個一個點，每點一個就開一個新分頁並自動登入');list.forEach(function(x){var a=document.createElement('a');a.href=location.origin+location.pathname+'#msa='+encodeURIComponent(x.acc);a.target='_blank';a.rel='noopener noreferrer';a.textContent='開啟 '+x.acc+(x.char?'　→ '+x.char:'');a.style.cssText='display:block;margin:6px 0;padding:12px;font-size:16px;border-radius:8px;color:white;background:rgb(90,70,140);text-decoration:none;text-align:center';a.onclick=function(){a.style.background='rgb(60,60,70)';a.textContent='已開：'+x.acc;};w.appendChild(a);});bigBtn(w,'關閉',function(){w.remove();shown=false;},'rgb(70,70,80)');};var showPicker=async function(f){if(shown)return;if(await autoLogin(f))return;shown=true;var list=await load();var w=box('要登入哪個帳號？');list.forEach(function(x){bigBtn(w,x.acc+(x.char?'　→ '+x.char:''),async function(){w.remove();busy=true;cur(x.acc);fill(f.acc,x.acc);fill(f.pwd,x.pwd);await sleep(300);var b=btn(/^登入$/);if(b)b.click();say('登入 '+x.acc+' 中…');setTimeout(function(){busy=false;shown=false;},8000);});});bigBtn(w,'＋ 新增帳號',function(){w.remove();addAccount();},'rgb(40,110,70)');if(list.length)bigBtn(w,'刪除帳號',function(){w.remove();manage();},'rgb(70,70,80)');bigBtn(w,'自己登入（關閉）',function(){w.remove();},'rgb(70,70,80)');};

var picked=false;
var pickChar=async function(cs){var acc=cur();if(!acc)return;var list=await load();var me=list.filter(function(x){return x.acc===acc;})[0];if(!me)return;var hit=me.char&&cs.filter(function(c){return c.name===me.char;})[0];if(hit){picked=true;say('進入 '+me.char);hit.btn.click();return;}if(document.getElementById('msaPhBox'))return;var w=box(acc+' 要自動進入哪個角色？（之後會記住）');cs.forEach(function(c){bigBtn(w,c.info,async function(){me.char=c.name;await save(list);w.remove();picked=true;c.btn.click();});});bigBtn(w,'這次我自己選',function(){w.remove();picked=true;},'rgb(70,70,80)');};

setInterval(async function(){try{
  if(inGame()){picked=false;tries=0;return;}
  var f=loginForm();if(f&&!busy){picked=false;await showPicker(f);return;}
  var cs=cards();if(cs.length&&!picked)await pickChar(cs);
}catch(e){say('錯誤：'+e.message);}},1200);
})();
