const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('第十周AI小组培训-网站展示版.html','utf8');
const count=(html.match(/<section class="slide(?:\s[^"]*)?"[^>]*>/g)||[]).length;
function el(){let b=false;return{classList:{toggle(){return b=!b}},setAttribute(k,v){this[k]=v},style:{},listeners:{},addEventListener(k,f){this.listeners[k]=f},click(){this.listeners.click?.()},matches(){return false}}}
const slides=Array.from({length:count},el),els=Object.fromEntries(['prev','next','status','progress','full','motion'].map(k=>[k,el()])),keys={},location={hash:''};
const document={body:el(),querySelectorAll:()=>slides,getElementById:id=>els[id],addEventListener:(k,f)=>keys[k]=f,documentElement:{}};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document,location,history:{replaceState(a,b,h){location.hash=h}},window:{scrollTo(){},addEventListener(){}}});
if(count!==38||!els.status.textContent.startsWith('01 / 38')||!els.prev.disabled)throw Error('initial');
els.next.click();if(!els.status.textContent.startsWith('02 / 38'))throw Error('next');
const e=k=>({key:k,target:{matches:()=>false},preventDefault(){}});keys.keydown(e('End'));if(!els.next.disabled||!els.status.textContent.startsWith('38 / 38'))throw Error('end');keys.keydown(e('ArrowLeft'));if(!els.status.textContent.startsWith('37 / 38'))throw Error('keyboard');
els.motion.click();if(els.motion['aria-pressed']!=='false')throw Error('motion');
for(const site of ['https://bruno-simon.com/','https://www.olivergareis.com/','https://cappen.com/'])if(!html.includes('href="'+site+'"'))throw Error(site);
if((html.match(/非真实网站截图/g)||[]).length!==3)throw Error('mockup labels');
console.log('38 pages: navigation, keyboard, motion control, three site links and visual labels passed');