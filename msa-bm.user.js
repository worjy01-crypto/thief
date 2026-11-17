// ==UserScript==
// @name         記憶聖境 黑市熱門詞綴提醒
// @namespace    worjy01-crypto
// @version      1.1
// @description  每一批黑市先讀「今日熱門詞綴」，再比對裝備詞綴，有的話推播到 Discord（Webhook 網址只存在你自己的瀏覽器）
// @match        *://*.hsagame.com/*
// @match        *://hsagame.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @connect      discord.com
// @connect      discordapp.com
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-bm.user.js
// @downloadURL  https://raw.githubusercontent.com/worjy01-crypto/thief/main/msa-bm.user.js
// ==/UserScript==
(async function(){
var FALLBACK_MS=600000,FIRST_MS=60000;
var B={on:true,msg:'剛啟動',next:Date.now()+FIRST_MS,busy:false,t0:'',fl:0};
var html=document.documentElement;
var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
var txt=function(e){return (e.textContent||'').replace(/\s+/g,' ').trim();};
var vis=function(e){return e.getClientRects().length>0;};
var hm=function(){var t=new Date();return ('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2);};
var get=async function(k,d){try{if(typeof GM_getValue==='function')return GM_getValue(k,d);if(typeof GM!=='undefined'&&GM.getValue)return await GM.getValue(k,d);}catch(e){}return d;};
var set=async function(k,v){try{if(typeof GM_setValue==='function')return GM_setValue(k,v);if(typeof GM!=='undefined'&&GM.setValue)return await GM.setValue(k,v);}catch(e){}};
var req=function(o){if(typeof GM_xmlhttpRequest==='function')return GM_xmlhttpRequest(o);if(typeof GM!=='undefined'&&GM.xmlHttpRequest)return GM.xmlHttpRequest(o);throw new Error('不支援 GM_xmlhttpRequest');};

/* ---------- 畫面上的標籤（右下角） ---------- */
var show=function(){var e=document.getElementById('msaBmTip');if(!e){e=document.createElement('div');e.id='msaBmTip';e.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;background:rgb(110,60,10);color:white;padding:4px 10px;border-radius:6px;font:12px sans-serif;opacity:0.9;cursor:pointer;max-width:60vw';e.title='點一下：開／關黑市提醒';e.onclick=function(){B.on=!B.on;set('bmOn',B.on);if(B.on)B.next=Date.now()+3000;show();};document.body.appendChild(e);}var w=Math.max(0,B.next-Date.now());var t=(B.on?'黑市提醒：':'黑市提醒（已關閉）：')+(B.busy?'檢查中…':B.msg+(B.on?'｜下次 '+(w>=60000?Math.ceil(w/60000)+' 分':Math.ceil(w/1000)+' 秒')+'後':''));if(e.textContent!==t)e.textContent=t;};

/* ---------- Discord ---------- */
var okHook=function(u){return /^https:\/\/(ptb\.|canary\.)?(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test(u||'');};
var send=function(hook,text){return new Promise(function(ok){try{req({method:'POST',url:hook,headers:{'Content-Type':'application/json'},data:JSON.stringify({username:'記憶聖境 黑市提醒',content:text.slice(0,1990)}),onload:function(r){ok(r.status>=200&&r.status<300?'':'Discord 回應 '+r.status+'：'+(r.responseText||'').slice(0,120));},onerror:function(){ok('連不到 Discord');}});}catch(e){ok(e.message);}});};
var setup=async function(force){var hook=await get('dcHook','');if(hook&&!force)return true;var u=prompt('【記憶聖境 黑市提醒】設定 Discord 通知\n請貼上 Discord 的 Webhook 網址（https://discord.com/api/webhooks/… 開頭）：\n（不想用就按取消，只在遊戲畫面提醒）',hook);if(u===null)return false;u=u.trim();if(!okHook(u)){alert('這個看起來不是 Discord Webhook 網址，請重新複製。\n可以從竄改猴選單的「重新設定 Discord 通知」再設。');return false;}await set('dcHook',u);var err=await send(u,'✅ 記憶聖境黑市提醒：Discord 設定完成，之後有熱門詞綴裝備會傳到這裡。');if(err){alert('測試訊息沒送出去：\n'+err);return false;}alert('已傳一則測試訊息到你的 Discord 頻道，有收到就成功了！');return true;};
var pushSend=async function(text){var hook=await get('dcHook','');if(!hook)return '（Discord 未設定）';var err=await send(hook,text);return err?'（Discord 失敗：'+err+'）':'（已傳 Discord）';};

/* ---------- 畫面提醒 ---------- */
var beep=function(){try{var C=window.AudioContext||window.webkitAudioContext;var ac=new C();[0,0.35,0.7].forEach(function(t){var o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.value=0.2;o.connect(g);g.connect(ac.destination);o.start(ac.currentTime+t);o.stop(ac.currentTime+t+0.2);});}catch(e){}};
var banner=function(list){var e=document.getElementById('msaBM');if(!e){e=document.createElement('div');e.id='msaBM';e.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:rgb(150,20,30);color:white;padding:10px 12px;border-radius:8px;font:14px sans-serif;box-shadow:0 2px 12px black';document.body.appendChild(e);}e.innerHTML='';var h=document.createElement('div');h.style.fontWeight='bold';h.textContent='【黑市熱門詞綴】'+hm()+' 這一批有：';e.appendChild(h);list.forEach(function(x){var d=document.createElement('div');d.textContent='・'+x;e.appendChild(d);});var c=document.createElement('button');c.textContent='知道了';c.style.cssText='margin-top:6px;padding:4px 12px';c.onclick=function(){e.remove();clearInterval(B.fl);if(B.t0)document.title=B.t0;};e.appendChild(c);beep();if(!B.t0)B.t0=document.title;clearInterval(B.fl);var f=false;B.fl=setInterval(function(){f=!f;document.title=f?'【黑市熱門】'+list.length+' 件':B.t0;},1000);};

/* ---------- 打開／讀取／關閉黑市 ---------- */
var anyT=function(re){var out=[];[].slice.call(document.querySelectorAll('body *')).forEach(function(e){if(!vis(e)||/^msa/.test(e.id)||!re.test(txt(e)))return;var c=e.closest('button,a,[role=button],[onclick],li')||e;if(out.indexOf(c)>=0||out.some(function(o){return c.contains(o);}))return;out=out.filter(function(o){return !o.contains(c);});out.push(c);});return out;};
var hotLine=function(){return [].slice.call(document.querySelectorAll('body *')).filter(function(e){return vis(e)&&/^今日熱門詞綴/.test(txt(e))&&txt(e).length<300;}).pop()||null;};
var panelOf=function(e){var p=e;while(p&&p!==document.body){if(getComputedStyle(p).position==='fixed')return p;p=p.parentElement;}return document.body;};
var closeBM=function(){var h=hotLine();if(!h)return;var p=panelOf(h);var x=p!==document.body?[].slice.call(p.querySelectorAll('button')).filter(function(b){return vis(b)&&(/^[×✕✖xX]$/.test(txt(b))||/關閉|close/i.test(b.getAttribute('aria-label')||b.title||''));}):[];if(x.length)x[0].click();else document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));};

var check=async function(){
  if(html.getAttribute('data-msa-busy')){B.next=Date.now()+20000;B.msg='自動練功正在操作，20 秒後再看';return;}
  B.busy=true;html.setAttribute('data-msa-busy','bm');var opened=false,wait=FALLBACK_MS;
  try{
    if(!hotLine()){
      var c=anyT(/^黑市$/);
      if(!c.length){var sh=anyT(/^商?\s*商店$/);if(sh.length){sh[0].click();await sleep(1500);}c=anyT(/^黑市$/);}
      if(!c.length){B.msg=hm()+' 找不到黑市按鈕';return;}
      c[0].click();opened=true;
      for(var k=0;k<16&&!hotLine();k++)await sleep(500);
    }
    var hl=hotLine();if(!hl){B.msg=hm()+' 黑市打不開或還在讀取，下次再試';return;}
    /* 1. 先讀這一刻的熱門詞綴（每次都重新讀，會隨玩家購買變動） */
    var hot={},names=[];
    txt(hl).replace(/^今日熱門詞綴\s*[：:]\s*/,'').split(/[、,，]/).forEach(function(p){var m=/^\s*(.+?)\s*[×xX]\s*([\d.]+)/.exec(p);if(m){hot[m[1].trim()]=m[2];names.push(m[1].trim()+'×'+m[2]);}});
    if(!names.length){B.msg=hm()+' 讀不到熱門詞綴';return;}
    /* 下一批的時間 */
    var root=panelOf(hl),nx=/下次更新\s*(\d{1,2})[:：](\d{2})/.exec(txt(root));
    if(nx){var sec=(+nx[1])*60+(+nx[2]);if(sec>0&&sec<=900)wait=(sec+30)*1000;}
    /* 2. 再一件一件看裝備的 ◆ 詞綴 */
    var seen=await get('bmSeen',[]);if(!Array.isArray(seen))seen=[];
    var found=[];
    [].slice.call(root.querySelectorAll('button,[role=button]')).filter(function(b){return /^購買$/.test(txt(b));}).forEach(function(b){
      var r=b;while(r&&r!==root&&!/憶銀/.test(txt(r)))r=r.parentElement;if(!r||r===root)return;
      var t=txt(r),hits=[],re=/◆\s*([^：:◆]+?)\s*[：:]/g,m;
      while((m=re.exec(t)))if(hot[m[1]]&&hits.indexOf(m[1])<0)hits.push(m[1]);
      if(!hits.length)return;
      var nm=t.split(/\s*[\d,]+K?\s*憶銀/)[0].trim(),pr=(/([\d,]+K?)\s*憶銀/.exec(t)||[])[1]||'';
      var lvq=(/需求\s*Lv\.?\s*(\d+)/.exec(t)||[])[1];
      var key=nm+'|'+pr;if(seen.indexOf(key)>=0)return;seen.push(key);
      found.push(nm+'（'+hits.map(function(x){return x+' ×'+hot[x];}).join('、')+'）'+(lvq?' 需求Lv.'+lvq:'')+' '+pr+' 憶銀');
    });
    await set('bmSeen',seen.slice(-300));
    if(found.length){
      banner(found);
      var res=await pushSend('【記憶聖境 黑市熱門詞綴】'+hm()+'\n今日熱門：'+names.join('、')+'\n'+found.map(function(x){return '・'+x;}).join('\n'));
      B.msg=hm()+' 有 '+found.length+' 件熱門！'+res;
    }else{
      B.msg=hm()+' 沒有新的熱門詞綴裝備（熱門：'+names.join('、')+'）';
    }
  }catch(e){B.msg='錯誤：'+e.message;}
  finally{if(opened){try{closeBM();}catch(e){}}B.next=Date.now()+wait;B.busy=false;html.removeAttribute('data-msa-busy');}
};

B.on=(await get('bmOn',true))!==false;
try{if(typeof GM_registerMenuCommand==='function')GM_registerMenuCommand('重新設定 Discord 通知',function(){setup(true);});}catch(e){}
var asked=await get('dcAsked',false);
if(!asked){await set('dcAsked',true);await setup(false);}
setInterval(function(){if(B.on&&!B.busy&&Date.now()>=B.next)check();show();},3000);
show();
})();
