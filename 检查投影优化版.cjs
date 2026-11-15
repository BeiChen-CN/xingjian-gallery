const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('第十周AI小组培训-投影优化版.html','utf8');
const count=(html.match(/<section class="slide(?:\s[^"]*)?"[^>]*>/g)||[]).length;
function el(){const set=new Set();return{value:'',classList:{toggle(k,force){const v=force===undefined?!set.has(k):force;v?set.add(k):set.delete(k);return v},add(k){set.add(k)},remove(k){set.delete(k)},contains(k){return set.has(k)}},setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},style:{},listeners:{},addEventListener(k,f){this.listeners[k]=f},click(){this.listeners.click?.()},matches(){return false}}}
const slides=Array.from({length:count},el),els=Object.fromEntries(['prev','next','status','progress','full','motion','jump'].map(k=>[k,el()])),keys={},location={hash:''},body=el();
const document={body,querySelectorAll:()=>slides,getElementById:id=>els[id],addEventListener:(k,f)=>keys[k]=f,documentElement:{}};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document,location,history:{replaceState(a,b,h){location.hash=h}},window:{scrollTo(){},addEventListener(){}}});
function check(ok,msg){if(!ok)throw Error(msg)}
check(count===41&&els.status.textContent.startsWith('01 / 41')&&els.prev.disabled,'initial');
els.jump.value='20';els.jump.listeners.change();check(els.status.textContent.startsWith('21 / 41')&&location.hash==='#21','jump');
els.next.click();check(els.jump.value==='21'&&els.status.textContent.startsWith('22 / 41'),'next sync');
keys.keydown({key:'End',target:{matches:()=>false},preventDefault(){}});check(els.next.disabled&&els.jump.value==='40','end');
const button=el(),stage=el(),status=el();button.setAttribute('aria-pressed','false');const slide={querySelector:s=>({'.bird-button':button,'.bird-stage':stage,'.bird-status':status}[s])};let observer;class MutationObserver{constructor(fn){observer=fn}observe(){}}
const reduced={matches:false,addEventListener(){}};vm.runInNewContext(html.match(/<script data-bird>([\s\S]*?)<\/script>/)[1],{document:{body,querySelectorAll:()=>[slide]},window:{matchMedia:()=>reduced},MutationObserver});
button.click();check(stage.classList.contains('bird-is-flying'),'bird start');body.classList.add('motion-off');observer();check(!stage.classList.contains('bird-is-flying')&&button.getAttribute('aria-pressed')==='false','bird stops');
check((html.match(/<option value="\d+">/g)||[]).length===41,'jump options');
console.log('41 pages: jump, navigation, keyboard, bird animation and motion toggle passed');
