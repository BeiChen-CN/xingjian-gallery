const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('第十周AI小组培训-翻页版.html','utf8');
const count=(html.match(/<section class="slide">/g)||[]).length;
function element(){return {classList:{toggle(){}},setAttribute(){},style:{},listeners:{},addEventListener(k,f){this.listeners[k]=f},click(){this.listeners.click?.()},matches(){return false}}}
const slides=Array.from({length:count},element),els=Object.fromEntries(['prev','next','status','bar','fullscreen'].map(k=>[k,element()]));
const keys={};const location={hash:''};const document={querySelectorAll:()=>slides,getElementById:id=>els[id],addEventListener:(k,f)=>keys[k]=f,documentElement:{}};const ctx={document,location,history:{replaceState(_a,_b,h){location.hash=h}},window:{scrollTo(){},addEventListener(){}},console};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
if(count!==15||els.status.textContent!=='第 1 / 15 页 · 方向键或空格翻页'||!els.prev.disabled)throw Error('initial state');
els.next.click();if(!els.status.textContent.startsWith('第 2 / 15'))throw Error('next');
keys.keydown({key:'End',target:{matches:()=>false},preventDefault(){}});if(!els.next.disabled||!els.status.textContent.startsWith('第 15 / 15'))throw Error('end');
keys.keydown({key:'ArrowLeft',target:{matches:()=>false},preventDefault(){}});if(!els.status.textContent.startsWith('第 14 / 15'))throw Error('keyboard');
console.log('15 slides: initial, next, End, previous keyboard passed');
