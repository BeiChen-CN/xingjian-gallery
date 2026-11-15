const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('第十周AI小组培训-包豪斯翻页版.html','utf8');
const count=(html.match(/<section class="slide">/g)||[]).length;
function element(){return {classList:{toggle(){}},setAttribute(){},style:{},listeners:{},addEventListener(k,f){this.listeners[k]=f},click(){this.listeners.click?.()},matches(){return false}}}
const slides=Array.from({length:count},element),els=Object.fromEntries(['prev','next','status','progress','full'].map(k=>[k,element()]));
const keys={},location={hash:''},document={querySelectorAll:()=>slides,getElementById:id=>els[id],addEventListener:(k,f)=>keys[k]=f,documentElement:{}};
const ctx={document,location,history:{replaceState(_a,_b,h){location.hash=h}},window:{scrollTo(){},addEventListener(){}}};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
if(count!==22||!els.status.textContent.startsWith('01 / 22')||!els.prev.disabled)throw Error('initial state: '+count);
els.next.click();if(!els.status.textContent.startsWith('02 / 22'))throw Error('next');
const event=k=>({key:k,target:{matches:()=>false},preventDefault(){}});keys.keydown(event('End'));if(!els.next.disabled||!els.status.textContent.startsWith('22 / 22'))throw Error('end');
keys.keydown(event('ArrowLeft'));if(!els.status.textContent.startsWith('21 / 22'))throw Error('keyboard');
console.log('22 slides: initial, next, End and previous passed');
