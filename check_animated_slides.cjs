const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('第十周AI小组培训-讲解动画版.html','utf8');
const count=(html.match(/<section class="slide">/g)||[]).length;
function element(){let state=false;return {classList:{toggle(){state=!state;return state}},setAttribute(k,v){this[k]=v},style:{},listeners:{},addEventListener(k,f){this.listeners[k]=f},click(){this.listeners.click?.()},matches(){return false}}}
const slides=Array.from({length:count},element),els=Object.fromEntries(['prev','next','status','progress','full','motion'].map(k=>[k,element()]));
const keys={},location={hash:''},document={body:element(),querySelectorAll:()=>slides,getElementById:id=>els[id],addEventListener:(k,f)=>keys[k]=f,documentElement:{}};
const ctx={document,location,history:{replaceState(_a,_b,h){location.hash=h}},window:{scrollTo(){},addEventListener(){}}};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
if(count!==26||!els.status.textContent.startsWith('01 / 26')||!els.prev.disabled)throw Error('initial '+count);
els.next.click();if(!els.status.textContent.startsWith('02 / 26'))throw Error('next');
const event=k=>({key:k,target:{matches:()=>false},preventDefault(){}});keys.keydown(event('End'));if(!els.next.disabled||!els.status.textContent.startsWith('26 / 26'))throw Error('end');
keys.keydown(event('ArrowLeft'));if(!els.status.textContent.startsWith('25 / 26'))throw Error('keyboard');
els.motion.click();if(els.motion.textContent!=='动效：关'||els.motion['aria-pressed']!=='false')throw Error('motion toggle');
if(!html.includes('prefers-reduced-motion:reduce')||!html.includes('@keyframes'))throw Error('animations');
console.log('26 slides: navigation, animation controls and reduced motion checks passed');
