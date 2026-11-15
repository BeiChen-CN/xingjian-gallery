/* 本地三维作品展厅：球体、光照、景深导航与作品入口。 */
(() => {
'use strict';
const sourceWorks=window.WORKS,works=Array.isArray(sourceWorks)?sourceWorks:[], host=document.getElementById('scene'), list=document.getElementById('list'), search=document.getElementById('search'), panel=document.getElementById('panel'),toggle=document.getElementById('toggle'),closeButton=document.getElementById('panel-close'),focus=document.getElementById('focus'),focusIndex=focus.querySelector('.focus-index'),focusStrong=focus.querySelector('strong'),focusDetail=focus.querySelector('.focus-detail'),focusEnter=document.getElementById('focus-enter'),focusCopy=document.getElementById('focus-copy'),focusClose=document.getElementById('focus-close'),toast=document.getElementById('toast'),error=document.getElementById('error'),errorText=document.getElementById('error-text'),brand=document.getElementById('brand'),notice=document.getElementById('notice'),labels=document.getElementById('labels');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)').matches||(navigator.maxTouchPoints>0&&innerWidth<=760);
const exhibition=window.EXHIBITION||{},exhibitionTitle=exhibition.title||'星间',exhibitionSubtitle=exhibition.subtitle||'学员 AI 作品展';
document.title=exhibitionTitle+' · '+exhibitionSubtitle;document.querySelector('.brand-title').textContent=exhibitionTitle;document.querySelector('.brand small').textContent=exhibitionSubtitle;
document.getElementById('total').textContent=works.length;toggle.setAttribute('aria-label','作品目录，共 '+works.length+' 件作品');
let selectPlanet=()=>{}, resetCamera=()=>{}, invalidateLabelLayout=()=>{},sceneReady=false;
function setSceneReady(ready){sceneReady=ready;document.body.classList.toggle('scene-ready',ready);document.getElementById('reset').disabled=!ready;for(const button of list.querySelectorAll('button'))button.disabled=!ready}
let panelOpen=false,panelAnimation=null,panelSequence=0,focusAnimation=null;
const panelEase='cubic-bezier(.22,.61,.36,1)';
function setPanel(open){
 const wasHidden=panel.hidden,previous=wasHidden?null:getComputedStyle(panel),from=previous?{opacity:previous.opacity,transform:previous.transform}:{opacity:0,transform:'translateY(-10px) scale(.985)'};
 panelOpen=open;toggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('directory-open',open);
 const sequence=++panelSequence;panelAnimation?.cancel();panelAnimation=null;
 if(reduced.matches){panel.hidden=!open;if(open)(coarse?closeButton:search).focus();return}
 if(open){panel.hidden=false;(coarse?closeButton:search).focus();panelAnimation=panel.animate([from,{opacity:1,transform:'translateY(0) scale(1)'}],{duration:440,easing:panelEase});}
 else if(!wasHidden){panelAnimation=panel.animate([from,{opacity:0,transform:'translateY(-6px) scale(.99)'}],{duration:220,easing:panelEase});}
 if(panelAnimation){const animation=panelAnimation;animation.finished.then(()=>{if(sequence!==panelSequence)return;panel.hidden=!open;panelAnimation=null;animation.cancel();}).catch(()=>{});}
}
function renderList(){const q=search.value.trim().toLowerCase();list.replaceChildren();const matching=works.filter(w=>(w.author+' '+w.title).toLowerCase().includes(q));if(!matching.length){const empty=document.createElement('div');empty.className='empty';empty.setAttribute('role','status');empty.textContent=works.length?'未找到作品':'暂无作品';list.append(empty);return}matching.forEach((w,i)=>{const row=document.createElement('div');row.className='work';row.setAttribute('role','listitem');row.style.setProperty('--row',String(i));const name=document.createElement('div');name.className='name';const title=document.createElement('strong');title.textContent=w.author+' · '+w.title;name.append(title);const locate=document.createElement('button');locate.textContent='定位';locate.disabled=!sceneReady;locate.setAttribute('aria-label','定位 '+w.author+' 的星球');locate.addEventListener('click',()=>{selectPlanet(w);setPanel(false);toggle.focus()});const link=document.createElement('a');link.href=w.url;link.textContent='进入';link.setAttribute('aria-label','进入 '+w.author+' 的作品');row.append(name,locate,link);list.append(row)})}
renderList();search.addEventListener('input',renderList);toggle.addEventListener('click',()=>setPanel(!panelOpen));closeButton.addEventListener('click',()=>{setPanel(false);toggle.focus()});document.getElementById('reset').addEventListener('click',()=>resetCamera());
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&panelOpen){e.stopImmediatePropagation();setPanel(false);toggle.focus()}});
function status(text){notice.textContent=text}
let toastTimer=0;
function toastMsg(text){toast.textContent=text;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),1800)}
async function copyLink(){const text=location.href;try{await navigator.clipboard.writeText(text);toastMsg('链接已复制')}catch{try{const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();toastMsg('链接已复制')}catch{toastMsg('复制失败，请复制地址栏')}}}
function info(w,extra,isSelected=false){
 const visible=!!w,wasVisible=focus.classList.contains('visible');
 if(wasVisible!==visible){focus.classList.toggle('visible',visible);invalidateLabelLayout()}
 const selectedNow=visible&&!!isSelected;
 if(focus.classList.contains('selected')!==selectedNow){focus.classList.toggle('selected',selectedNow);invalidateLabelLayout()}
 if(!w){focusAnimation?.cancel();focusAnimation=null;focusIndex.textContent='';focusStrong.textContent='';focusDetail.textContent='';return}
 const index=works.indexOf(w),ordinal=index>=0?String(index+1).padStart(2,'0'):'',title=w.author+' · '+w.title,detail=extra||'点击进入';
 if(focusIndex.textContent!==ordinal){focusIndex.textContent=ordinal;invalidateLabelLayout()}
 if(focusStrong.textContent!==title){focusStrong.textContent=title;invalidateLabelLayout();if(!reduced.matches&&wasVisible){focusAnimation?.cancel();focusAnimation=focusStrong.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:panelEase});}}
 if(focusDetail.textContent!==detail){focusDetail.textContent=detail;invalidateLabelLayout()}
}
reduced.addEventListener('change',()=>{if(!reduced.matches)return;++panelSequence;panelAnimation?.cancel();panelAnimation=null;panel.hidden=!panelOpen;focusAnimation?.cancel();focusAnimation=null;});
focusCopy.addEventListener('click',copyLink);document.getElementById('error-retry').addEventListener('click',()=>location.reload());brand.addEventListener('click',()=>resetCamera());
const guide=document.querySelector('.guide');if(coarse&&guide)guide.textContent='拖动旋转 · 双指缩放 · 轻触星球进入';
const bootText=document.getElementById('boot-text');if(bootText)bootText.textContent=works.length?'正在点亮 '+works.length+' 颗星球…':'正在准备展厅…';
function startScene(){
try{
 if(!Array.isArray(sourceWorks))throw Error('作品数据未加载');
 if(!window.THREE)throw Error('Three.js 未加载');
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#101917',.0024);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,400);
 scene.add(new THREE.HemisphereLight('#d6ded2','#11171c',.34));
 const sun=new THREE.DirectionalLight('#fff0d9',2.7);sun.position.set(-15,8,10);scene.add(sun);
 const rim=new THREE.DirectionalLight('#a1c1ca',1.15);rim.position.set(9,-2,-10);scene.add(rim);
 const bounce=new THREE.DirectionalLight('#cfaa7c',.24);bounce.position.set(-8,-6,3);scene.add(bounce);
 // Bake a small local studio environment once, shared by all four materials.
 const studio=document.createElement('canvas');studio.width=512;studio.height=256;const lightInk=studio.getContext('2d'),sky=lightInk.createLinearGradient(0,0,0,256);
 sky.addColorStop(0,'#8f9d93');sky.addColorStop(.42,'#3a4641');sky.addColorStop(1,'#11171b');lightInk.fillStyle=sky;lightInk.fillRect(0,0,512,256);
 for(const box of [[142,85,38,112,'rgba(255,235,203,.95)'],[388,100,100,34,'rgba(205,226,233,.65)']]){lightInk.save();lightInk.shadowBlur=18;lightInk.shadowColor=box[4];const band=lightInk.createLinearGradient(0,box[1]-box[3]/2,0,box[1]+box[3]/2);band.addColorStop(0,'rgba(255,255,255,0)');band.addColorStop(.2,box[4]);band.addColorStop(.8,box[4]);band.addColorStop(1,'rgba(255,255,255,0)');lightInk.fillStyle=band;lightInk.fillRect(box[0]-box[2]/2,box[1]-box[3]/2,box[2],box[3]);lightInk.restore()}
 const studioMap=new THREE.CanvasTexture(studio);studioMap.colorSpace=THREE.SRGBColorSpace;studioMap.mapping=THREE.EquirectangularReflectionMapping;
 const pmrem=new THREE.PMREMGenerator(renderer),studioTarget=pmrem.fromEquirectangular(studioMap);scene.environment=studioTarget.texture;pmrem.dispose();studioMap.dispose();
 // Seeded detail keeps each visit visually consistent without external textures.
 let seed=271828;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const bg=document.createElement('canvas');bg.width=64;bg.height=64;
 const bc=bg.getContext('2d'),g=bc.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,246,219,1)');g.addColorStop(.08,'rgba(243,228,190,.8)');g.addColorStop(.25,'rgba(182,204,190,.18)');g.addColorStop(1,'rgba(145,185,174,0)');bc.fillStyle=g;bc.fillRect(0,0,64,64);
 const glowTex=new THREE.CanvasTexture(bg),starGeo=new THREE.BufferGeometry(),coords=[],colors=[];
 for(let i=0;i<2100;i++){
  const radius=60+random()*120,theta=random()*Math.PI*2,z=random()*2-1,s=Math.sqrt(1-z*z);
  coords.push(radius*s*Math.cos(theta),radius*z,radius*s*Math.sin(theta));
  const color=new THREE.Color().setHSL(.08+random()*.12,.12+random()*.18,.55+random()*.38);colors.push(color.r,color.g,color.b);
 }
 starGeo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({size:1.4,map:glowTex,vertexColors:true,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);
 const nearStarGeo=new THREE.BufferGeometry(),nearCoords=new Float32Array(180*3),nearPhases=new Float32Array(180);
 for(let i=0;i<180;i++){nearCoords[i*3]=(random()-.5)*90;nearCoords[i*3+1]=(random()-.5)*65;nearCoords[i*3+2]=-25-random()*55;nearPhases[i]=random()*Math.PI*2}
 nearStarGeo.setAttribute('position',new THREE.BufferAttribute(nearCoords,3));nearStarGeo.setAttribute('phase',new THREE.BufferAttribute(nearPhases,1));
 const nearStars=new THREE.Points(nearStarGeo,new THREE.ShaderMaterial({uniforms:{time:{value:0},motion:{value:reduced.matches?0:1},pixelScale:{value:renderer.getPixelRatio()}},vertexShader:'attribute float phase; uniform float time; uniform float motion; uniform float pixelScale; varying float shimmer; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp((1.7+0.5*sin(phase))*pixelScale*55.0/max(-p.z,1.0),1.0,7.0);shimmer=0.45+0.25*sin(time*0.7+phase)*motion;}',fragmentShader:'varying float shimmer; void main(){float r=length(gl_PointCoord-0.5)*2.0;float halo=exp(-r*r*10.0)*(1.0-smoothstep(0.7,1.0,r));gl_FragColor=vec4(0.8,0.84,0.78,halo*shimmer);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(nearStars);
 const nebula=new THREE.Mesh(new THREE.PlaneGeometry(130,65),new THREE.ShaderMaterial({
  uniforms:{time:{value:0}},
  vertexShader:'varying vec2 p; void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float time; varying vec2 p; void main(){vec2 q=(p-0.5)*2.0;float v=q.y+sin(q.x*2.8+time*0.035)*0.22;float n=0.5+0.18*sin(q.x*13.0+sin(v*8.0+time*0.025))+0.12*cos(q.x*27.0-v*11.0-time*0.02);float a=exp(-q.x*q.x*5.0-v*v*13.0)*(0.18+n*0.22);a*=1.0-smoothstep(0.7,1.0,abs(q.x));a*=1.0-smoothstep(0.7,1.0,abs(q.y));gl_FragColor=vec4(mix(vec3(0.19,0.31,0.28),vec3(0.32,0.25,0.17),n),a);}',
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
 }));nebula.position.set(13,5,-75);nebula.rotation.z=-.28;scene.add(nebula);
 const haze=new THREE.Mesh(new THREE.PlaneGeometry(100,60),nebula.material.clone());haze.material.uniforms.time.value=7;haze.position.set(-18,-8,-95);haze.rotation.z=.45;scene.add(haze);
 const orrery=new THREE.Group();scene.add(orrery);
 const instrumentMaterial=new THREE.LineBasicMaterial({color:'#bca37b',transparent:true,opacity:.36,depthWrite:false});
 const instrumentUp=new THREE.Vector3(0,.7,-Math.sqrt(.51)),instrumentLines=[];
 for(const radius of [.46,.62]){const points=[];for(let j=0;j<96;j++){const a=j/96*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius*instrumentUp.y,Math.sin(a)*radius*instrumentUp.z))}orrery.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),instrumentMaterial))}
 for(let j=0;j<32;j++){const a=j/32*Math.PI*2,inner=j%4===0?.75:.83;for(const r of [inner,.9])instrumentLines.push(Math.cos(a)*r,Math.sin(a)*r*instrumentUp.y,Math.sin(a)*r*instrumentUp.z)}
 const ticks=new THREE.BufferGeometry();ticks.setAttribute('position',new THREE.Float32BufferAttribute(instrumentLines,3));orrery.add(new THREE.LineSegments(ticks,instrumentMaterial));
 const tracePoints=[];for(let j=0;j<=64;j++){const a=.06+j/64*.42;tracePoints.push(new THREE.Vector3(Math.cos(a),Math.sin(a),0))}const traceGeometry=new THREE.BufferGeometry().setFromPoints(tracePoints);
 const orbitVertex='attribute float progress; varying float arc; void main(){arc=progress;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 const orbitFragment=`
  uniform vec3 tint; uniform float time; uniform float alpha; uniform float reveal; uniform float origin; uniform float moving; varying float arc;
  void main(){float along=fract(arc-origin+1.0);if(along>reveal)discard;float trail=fract(time*0.026+origin-arc+1.0);float sweep=exp(-trail*70.0)*moving;gl_FragColor=vec4(tint,min(alpha*(0.92+sweep*3.1),0.72));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`;
 const rippleGeometry=new THREE.TorusGeometry(1,.0045,4,128);
 // One GPU dust field and one infrequent meteor keep ambient motion inexpensive.
 const dustData=new Float32Array(280*3);for(let i=0;i<280;i++){dustData[i*3]=9.4+random()*5;dustData[i*3+1]=random()*Math.PI*2;dustData[i*3+2]=(random()-.5)*1.5}
 const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustData,3));
 const dust=new THREE.Points(dustGeometry,new THREE.ShaderMaterial({uniforms:{time:{value:0},opacity:{value:0},pixelScale:{value:renderer.getPixelRatio()}},vertexShader:`
  uniform float time; uniform float pixelScale; varying float brightness;
  void main(){float a=position.y+time*(0.003+position.z*0.0007);vec3 q=vec3(cos(a)*position.x,sin(a)*position.x*0.7+position.z,-sin(a)*position.x*0.71414);vec4 p=modelViewMatrix*vec4(q,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pixelScale*35.0/max(-p.z,1.0),0.8,3.2);brightness=0.5+0.5*sin(position.y*13.0+time*0.3);}`,fragmentShader:`
  uniform float opacity; varying float brightness;void main(){float d=length(gl_PointCoord-0.5)*2.0;gl_FragColor=vec4(0.79,0.72,0.57,exp(-d*d*8.0)*opacity*(0.4+brightness*0.6));}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);
 const meteor=new THREE.Mesh(new THREE.PlaneGeometry(12,.08),new THREE.ShaderMaterial({uniforms:{time:{value:0},opacity:{value:0}},vertexShader:`
  uniform float time; varying vec2 p;void main(){p=uv;float t=mod(time+8.0,21.0)/1.8;vec3 q=position;q.x+=(t-0.5)*31.0;q.y-=t*5.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.0);}`,fragmentShader:`
  uniform float time; uniform float opacity; varying vec2 p;void main(){float t=mod(time+8.0,21.0)/1.8;float gate=smoothstep(0.0,0.18,t)*(1.0-smoothstep(0.65,1.0,t));float tail=pow(p.x,5.0)*(1.0-smoothstep(0.94,1.0,p.x));float edge=1.0-abs(p.y*2.0-1.0);gl_FragColor=vec4(0.8,0.86,0.86,tail*edge*gate*opacity);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));meteor.position.set(8,13,-38);meteor.rotation.z=-.18;scene.add(meteor);
 const ambientPointer={x:0,y:0,targetX:0,targetY:0};
 const logs=works.map(w=>Math.log(Math.max(1,w.bytes))),min=Math.min(...logs),max=Math.max(...logs),meshes=[],byWork=new Map(),sphereGeometry=new THREE.SphereGeometry(1,192,128);
 // 2048 is comfortable for a showcase set; larger classes trade texel density for a bounded GPU/CPU budget.
 const lowMemory=(navigator.deviceMemory||8)<=4;
 const textureWidth=Math.min(renderer.capabilities.maxTextureSize,lowMemory?1024:works.length<=8?2048:works.length<=16?1536:1024);
 function mineralHash(x,y,z){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0}
 function mineralGradient(hash,x,y,z){const h=hash&15,u=h<8?x:y,v=h<4?y:h===12||h===14?x:z;return (h&1?-u:u)+(h&2?-v:v)}
 // Gradient noise with quintic blending avoids a grid of flat shading patches.
 function mineralNoise(x,y,z){
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,u=fx*fx*fx*(fx*(fx*6-15)+10),v=fy*fy*fy*(fy*(fy*6-15)+10),w=fz*fz*fz*(fz*(fz*6-15)+10);
  const a=mineralGradient(mineralHash(ix,iy,iz),fx,fy,fz),b=mineralGradient(mineralHash(ix+1,iy,iz),fx-1,fy,fz),c=mineralGradient(mineralHash(ix,iy+1,iz),fx,fy-1,fz),d=mineralGradient(mineralHash(ix+1,iy+1,iz),fx-1,fy-1,fz);
  const e=mineralGradient(mineralHash(ix,iy,iz+1),fx,fy,fz-1),f=mineralGradient(mineralHash(ix+1,iy,iz+1),fx-1,fy,fz-1),g=mineralGradient(mineralHash(ix,iy+1,iz+1),fx,fy-1,fz-1),h=mineralGradient(mineralHash(ix+1,iy+1,iz+1),fx-1,fy-1,fz-1);
  const near=a+(b-a)*u+(c+(d-c)*u-a-(b-a)*u)*v,far=e+(f-e)*u+(g+(h-g)*u-e-(f-e)*u)*v;return near+(far-near)*w;
 }
 // Profile order: sandstone, oxidized bronze, frosted quartz, wheel-thrown clay.
 function texture(w,i){
  const width=textureWidth,height=width>>1,kind=i%4,color=new Uint8Array(width*height*4),detail=new Uint16Array(color.length),base=new THREE.Color(w.color||'#aaa58d').convertLinearToSRGB(),rgb=[base.r*255,base.g*255,base.b*255];
  const darkScale=[.64,.7,.55,.62][kind],lightScale=[.86,.8,.42,.9][kind],whiteMix=[.14,.1,.5,.1][kind];
  const dark=rgb.map(v=>v*darkScale),light=rgb.map(v=>v*lightScale+255*whiteMix);
  if(kind===1){dark[0]=157*.8+rgb[0]*.2;dark[1]=117*.8+rgb[1]*.2;dark[2]=65*.8+rgb[2]*.2;for(let k=0;k<3;k++)light[k]=rgb[k]*.66}
  const longitudeCos=new Float32Array(width),longitudeSin=new Float32Array(width);for(let x=0;x<width;x++){const a=x/(width-1)*Math.PI*2;longitudeCos[x]=Math.cos(a);longitudeSin[x]=Math.sin(a)}
  const phase=i*11.73;
  for(let y=0;y<height;y++){
   const lat=(y/(height-1)-.5)*Math.PI,ny=Math.sin(lat),polar=Math.cos(lat);
   for(let x=0;x<width;x++){
    const nx=polar*longitudeCos[x],nz=polar*longitudeSin[x],low=mineralNoise(nx*2.4+phase,ny*2.4,nz*2.4),medium=mineralNoise(nx*8+phase,ny*8,nz*8),fine=mineralNoise(nx*29+phase,ny*29,nz*29),grit=mineralNoise(nx*91+phase,ny*91,nz*91);
    let mix,bump,rough,metal;
    if(kind===0){const beds=Math.sin(ny*36+low*2.5+medium*.5),seam=Math.pow(.5+.5*beds,14),crack=Math.pow(Math.max(0,1-Math.abs(medium+low*.25)*22),2),pit=Math.pow(Math.max(0,grit),3),grain=Math.max(0,grit-.38),lightGrain=Math.max(0,-grit-.42);mix=.5+low*.26+medium*.12+fine*.075+beds*.03-seam*.11-crack*.09-pit*.2-grain*.2+lightGrain*.15;bump=.5+medium*.1+fine*.055+grit*.04-crack*.05-pit*.05;rough=.84+grit*.06+pit*.1;metal=0}
    else if(kind===1){let oxide=Math.max(0,Math.min(1,(low*.25+medium*.55+fine*.2+.06)/.4));oxide=oxide*oxide*(3-2*oxide);const brushing=mineralNoise(nx*72+phase,ny*7,nz*72),rim=Math.max(0,1-Math.abs(oxide-.5)*7),grain=Math.max(0,grit-.5);mix=oxide*.9+medium*.06+fine*.04-rim*.06-grain*.12;bump=.5+medium*.045+fine*.03+brushing*.015;rough=.42+oxide*.34+brushing*.05;metal=.8-oxide*.58}
    else if(kind===2){const vein=Math.pow(Math.max(0,1-Math.abs(medium+low*.24)*35),2);mix=.54+low*.24+fine*.05+vein*.22;bump=.5+fine*.02+grit*.012-vein*.018;rough=.42+fine*.06;metal=.02}
    else{const grooves=Math.sin(ny*128+medium*.4)+.35*Math.sin(ny*311+fine*.6),pit=Math.pow(Math.max(0,grit),4),grain=Math.max(0,grit-.4);mix=.48+low*.13+medium*.07+fine*.055+grooves*.012-pit*.14-grain*.16;bump=.5+grooves*.07+fine*.03+grit*.02-pit*.03;rough=.82+grit*.06;metal=0}
    const p=(y*width+x)*4;for(let k=0;k<3;k++){const v=Math.round(dark[k]+(light[k]-dark[k])*mix+grit*2);color[p+k]=v<0?0:v>255?255:v}color[p+3]=255;
    // Half-float height avoids terracing; G/B also carry linear roughness and metalness.
    detail[p]=THREE.DataUtils.toHalfFloat(bump);detail[p+1]=THREE.DataUtils.toHalfFloat(rough);detail[p+2]=THREE.DataUtils.toHalfFloat(metal);detail[p+3]=THREE.DataUtils.toHalfFloat(1);
   }
  }
  const map=new THREE.DataTexture(color,width,height),packed=new THREE.DataTexture(detail,width,height,THREE.RGBAFormat,THREE.HalfFloatType);map.colorSpace=THREE.SRGBColorSpace;
  for(const image of [map,packed]){image.wrapS=THREE.RepeatWrapping;image.magFilter=THREE.LinearFilter;image.minFilter=THREE.LinearMipmapLinearFilter;image.generateMipmaps=true;image.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());image.needsUpdate=true}
  return {map,packed,kind,bumpScale:[1,.4,.12,.6][kind],relief:[.05,0,0,.022][kind],envMapIntensity:[.36,.55,.52,.35][kind]};
 }
 works.forEach((w,i)=>{
  const radius=1.1+(max===min?.5:(logs[i]-min)/(max-min))*1.15,root=new THREE.Group();root.position.fromArray(w.pos||[Math.cos(i*2.4)*7,Math.sin(i*1.6)*4,Math.sin(i*2.4)*7]);scene.add(root);
  const orbitRadius=root.position.length(),orbitUp=new THREE.Vector3(0,root.position.y,root.position.z);if(orbitUp.lengthSq()<.0001)orbitUp.copy(instrumentUp);else orbitUp.normalize();if(orbitUp.dot(instrumentUp)<0)orbitUp.negate();
  const orbitPoints=[];for(let j=0;j<=256;j++){const a=j/256*Math.PI*2;orbitPoints.push(new THREE.Vector3(Math.cos(a)*orbitRadius,Math.sin(a)*orbitRadius*orbitUp.y,Math.sin(a)*orbitRadius*orbitUp.z))}
  const baseAngle=Math.atan2(root.position.dot(orbitUp),root.position.x),orbitGeometry=new THREE.BufferGeometry().setFromPoints(orbitPoints),progress=new Float32Array(257);for(let j=0;j<=256;j++)progress[j]=j/256;
  orbitGeometry.setAttribute('progress',new THREE.BufferAttribute(progress,1));
  const orbit=new THREE.Line(orbitGeometry,new THREE.ShaderMaterial({uniforms:{tint:{value:new THREE.Color('#bca37b')},time:{value:0},alpha:{value:0},reveal:{value:reduced.matches?1:0},origin:{value:((baseAngle/Math.PI/2)%1+1)%1},moving:{value:reduced.matches?0:1}},vertexShader:orbitVertex,fragmentShader:orbitFragment,transparent:true,depthWrite:false}));orrery.add(orbit);
  const orbitFrame=new THREE.Group();orbitFrame.rotation.x=Math.atan2(orbitUp.z,orbitUp.y);orrery.add(orbitFrame);
  const trace=new THREE.Line(traceGeometry,new THREE.LineBasicMaterial({color:'#ddc69b',transparent:true,opacity:0,depthWrite:false}));trace.scale.setScalar(orbitRadius);trace.visible=false;orbitFrame.add(trace);
  const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#e5cea0',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));marker.scale.setScalar(.23);marker.visible=false;orbitFrame.add(marker);
  const surface=texture(w,i),parameters={map:surface.map,bumpMap:surface.packed,roughnessMap:surface.packed,metalnessMap:surface.packed,bumpScale:surface.bumpScale,roughness:1,metalness:1,envMapIntensity:surface.envMapIntensity};
  if(surface.relief){parameters.displacementMap=surface.packed;parameters.displacementScale=surface.relief;parameters.displacementBias=-surface.relief*.5}
  const material=surface.kind===2?new THREE.MeshPhysicalMaterial({...parameters,clearcoat:.55,clearcoatRoughness:.34,transmission:.12,thickness:.7,attenuationColor:new THREE.Color('#aab0cf'),attenuationDistance:2.4,ior:1.46,iridescence:.06,iridescenceIOR:1.3,iridescenceThicknessRange:[180,280]}):new THREE.MeshStandardMaterial(parameters);
  material.emissive.set(w.color||'#aaa58d');
  const sphere=new THREE.Mesh(sphereGeometry,material);sphere.scale.setScalar(radius);root.add(sphere);sphere.userData.work=w;meshes.push(sphere);
  const air=new THREE.Mesh(sphereGeometry,new THREE.ShaderMaterial({uniforms:{tint:{value:new THREE.Color(w.color||'#acc8bb')},strength:{value:[.045,.055,.11,.04][surface.kind]}},vertexShader:'varying vec3 n; varying vec3 v; varying vec3 worldN; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);worldN=normalize(mat3(modelMatrix)*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 tint; uniform float strength; varying vec3 n; varying vec3 v; varying vec3 worldN; void main(){float rim=pow(1.0-max(dot(normalize(n),normalize(v)),0.0),3.5);float light=0.25+0.75*max(dot(normalize(worldN),normalize(vec3(-9.0,12.0,15.0))),0.0);gl_FragColor=vec4(tint,rim*strength*light);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));air.scale.setScalar(radius*1.012);root.add(air);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:w.color||'#a2c5b6',transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.setScalar(radius*5);root.add(glow);
  if(surface.kind===1){const mount=new THREE.Mesh(new THREE.TorusGeometry(radius*1.32,.009,6,160,Math.PI*1.65),new THREE.MeshBasicMaterial({color:'#c1ac84',transparent:true,opacity:.5,depthWrite:false}));mount.rotation.set(.65,.2,-.25);root.add(mount)}
  const label=document.createElement('div');label.className='label';const number=document.createElement('span'),text=document.createElement('strong'),sub=document.createElement('small');number.className='label-index';number.textContent=String(i+1).padStart(2,'0');text.textContent=w.author;sub.textContent=w.title;label.append(number,text,sub);labels.append(label);
  const selectionRing=new THREE.Mesh(new THREE.TorusGeometry(radius*1.19,.009,6,128),new THREE.MeshBasicMaterial({color:'#dec89a',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));selectionRing.visible=false;root.add(selectionRing);
  const ripple=new THREE.Mesh(rippleGeometry,new THREE.MeshBasicMaterial({color:'#ddc79d',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));ripple.visible=false;root.add(ripple);
  byWork.set(w,{root,sphere,radius,label,glow,selectionRing,ripple,rippleAge:2,index:i,reveal:reduced.matches?1:0,orbit,orbitRadius,orbitUp,trace,marker,baseAngle,angle:baseAngle,orbitClock:0,driftPhase:i*1.7,driftRate:.15+i*.011,driftAmplitude:Math.min(.105,.48/orbitRadius),motionWeight:1,motionVelocity:0,spinBase:[.038,.022,.032,.027][surface.kind],envBase:surface.envMapIntensity,highlight:0});
 });
 const target=new THREE.Vector3(),desiredTarget=new THREE.Vector3(),offset=new THREE.Vector3(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const narrow=()=>innerWidth<=760,panoramaDistance=()=>narrow()?43:24,panoramaTarget=()=>desiredTarget.set(narrow()?.4:0,narrow()?1.3:0,0);
 let yaw=.18,pitch=.15,wantedYaw=yaw,wantedPitch=pitch,yawVelocity=0,pitchVelocity=0,distance=panoramaDistance()*(reduced.matches?1:1.08),wantedDistance=panoramaDistance(),zoomVelocity=0,selected=null,hovered=null,entering=false,pendingEntry=null,pendingConfirmed=false,pixelRatio=renderer.getPixelRatio();
 const clamp=THREE.MathUtils.clamp,entryVeil=document.getElementById('entry-veil');panoramaTarget();target.copy(desiredTarget);
 const entry={work:null,elapsed:0,duration:1.35,fromLog:0,toLog:0,velocity:0,orbitAngle:0,opaqueFrame:false,fromTarget:new THREE.Vector3(),targetVelocity:new THREE.Vector3()};
 function positionCamera(){const cp=Math.cos(pitch);offset.set(Math.sin(yaw)*cp,Math.sin(pitch),Math.cos(yaw)*cp).multiplyScalar(distance);camera.position.copy(target).add(offset);camera.lookAt(target);camera.updateMatrixWorld()}
 function pick(x,y){const rect=renderer.domElement.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-((y-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(meshes,false)[0]?.object.userData.work||null}
 const nearestProjection=new THREE.Vector3();
 function nearest(x,y){let best=null,bestD=Infinity;for(const w of works){const o=byWork.get(w),p=nearestProjection.copy(o.root.position).project(camera);if(p.z>=1)continue;const d=Math.hypot((p.x+1)*innerWidth/2-x,(1-p.y)*innerHeight/2-y);if(d<bestD){bestD=d;best=w}}return best}
 function enter(w,reveal=false){
  if(!w||entering)return;entering=true;
  const url=new URL(w.url,location.href);if(reveal&&!reduced.matches)url.searchParams.set('__exhibition','enter');location.href=url.href;
 }
 function cancelEntry(){
  if(entry.work){wantedDistance=Math.max(distance,byWork.get(entry.work).radius*2.2);entry.work=null}
  pendingEntry=null;pendingConfirmed=false;document.body.classList.remove('is-entering');
  entryVeil.style.transition='opacity .32s cubic-bezier(.22,.61,.36,1)';entryVeil.style.opacity='0';
 }
 function beginEntry(w){
  pendingEntry=null;pendingConfirmed=false;
  if(reduced.matches){enter(w);return}
  entry.work=w;entry.elapsed=0;entry.fromLog=Math.log(distance);entry.toLog=Math.log(byWork.get(w).radius*1.18);
  entry.duration=Math.min(1.35,2*(entry.fromLog-entry.toLog)/Math.max(.001,-zoomVelocity));
  entry.velocity=zoomVelocity*entry.duration;entry.fromTarget.copy(target);entry.targetVelocity.copy(desiredTarget).sub(target).multiplyScalar(5.3);entry.orbitAngle=byWork.get(w).angle;entry.opaqueFrame=false;
  entryVeil.style.transition='none';entryVeil.style.opacity='0';document.body.classList.add('is-entering');
  info(w,coarse?'进入中 · 缩小取消':'进入中 · Esc 或向外取消',true);
 }
 function setHash(w){const index=w?works.indexOf(w):-1;try{history.replaceState(null,'',index>=0?'#work-'+(index+1):location.pathname+location.search)}catch{}}
 selectPlanet=w=>{const o=byWork.get(w);if(!o)return;cancelEntry();selected=w;setHash(w);wantedYaw=yaw+.07;wantedPitch=pitch;invalidateLabelLayout();desiredTarget.copy(o.root.position);wantedDistance=Math.max(o.radius*(narrow()?5.4:4.5),8);info(w,coarse?'已选中 · 轻触进入或双指放大':'已选中 · 进入作品或继续靠近',true)};
 resetCamera=()=>{cancelEntry();selected=null;hovered=null;setHash(null);invalidateLabelLayout();panoramaTarget();wantedDistance=panoramaDistance();wantedYaw=.18;wantedPitch=.15;info(null,undefined,false);status('已返回全景')};
 function zoom(delta,x,y,pickFirst){
  if(!delta||entering)return;
  if(delta>0){const cancel=!!pendingEntry||!!entry.work;cancelEntry();if(cancel)info(selected,'已取消进入',true)}
  if(entry.work)return;
  if(delta<0){const over=pick(x,y),w=(pickFirst&&over)||selected||over||nearest(x,y);if(w&&w!==selected){selected=w;setHash(w);wantedYaw=yaw+.07;invalidateLabelLayout();desiredTarget.copy(byWork.get(w).root.position);wantedDistance=Math.max(wantedDistance,byWork.get(w).radius*4);info(w,coarse?'双指放大继续靠近':'继续滚动靠近',true)}}
  const r=selected?byWork.get(selected).radius:1;wantedDistance=clamp(wantedDistance*Math.exp(delta*.0012),r*1.75,75);
  if(delta<0&&selected&&wantedDistance<=r*1.8){if(pendingEntry!==selected){pendingEntry=selected;pendingConfirmed=false}else pendingConfirmed=true;info(selected,coarse?'继续放大进入 · 缩小取消':'继续滚动进入 · 向外取消',true)}
 }
 const canvas=renderer.domElement;canvas.addEventListener('wheel',e=>{e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1,over=pick(e.clientX,e.clientY);if(over!==hovered){hovered=over;canvas.style.cursor=over?'pointer':'grab';invalidateLabelLayout()}zoom(clamp(e.deltaY*unit,-240,240),e.clientX,e.clientY,true)},{passive:false});
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){ambientPointer.targetX=e.clientX/innerWidth*2-1;ambientPointer.targetY=e.clientY/innerHeight*2-1}});
 canvas.addEventListener('pointerleave',()=>{ambientPointer.targetX=0;ambientPointer.targetY=0});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(entry.work||pendingEntry)){e.stopImmediatePropagation();cancelEntry();info(selected,'已取消进入',true)}});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panelOpen&&!entry.work&&!pendingEntry&&selected){resetCamera();toggle.focus()}});
 focusEnter.addEventListener('click',()=>{if(selected)enter(selected)});
 focusClose.addEventListener('click',()=>{resetCamera();toggle.focus()});
 const fingers=new Map();let drag=null,pinch=null,moved=false;canvas.addEventListener('pointerdown',e=>{cancelEntry();const work=pick(e.clientX,e.clientY);if(work)hovered=work;wantedYaw=yaw;wantedPitch=pitch;canvas.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===1){drag={x:e.clientX,y:e.clientY,work};moved=false}else if(fingers.size===2){const a=[...fingers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);moved=true}});
 canvas.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId)){if(entry.work)return;if(e.pointerType==='mouse'){hovered=pick(e.clientX,e.clientY);canvas.style.cursor=hovered?'pointer':'grab';const target=hovered||selected,targetSelected=!!selected&&target===selected;info(target,targetSelected&&pendingEntry?(coarse?'继续放大进入 · 缩小取消':'继续滚动进入 · 向外取消'):targetSelected?(coarse?'已选中 · 轻触进入或双指放大':'已选中 · 点击进入或继续靠近'):(coarse?'轻触进入':'点击进入'),targetSelected)}return}const prev=fingers.get(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size>=2){const a=[...fingers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch&&d>0)zoom(-Math.log(d/pinch)*830,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);pinch=d;moved=true}else if(drag){wantedYaw-=(e.clientX-prev.x)*.006;wantedPitch=clamp(wantedPitch+(e.clientY-prev.y)*.006,-1.5,1.5);if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)moved=true}});
 canvas.addEventListener('pointerup',e=>{if(fingers.size===1&&!moved&&drag)enter(drag.work||pick(e.clientX,e.clientY));fingers.delete(e.pointerId);pinch=null;if(fingers.size===1){const p=[...fingers.values()][0];drag={x:p.x,y:p.y,work:null};moved=true}else if(!fingers.size){drag=null;hovered=null}});canvas.addEventListener('pointercancel',e=>{fingers.delete(e.pointerId);drag=null;pinch=null;moved=true;hovered=null});canvas.addEventListener('pointerleave',()=>{if(!fingers.size&&!entry.work){hovered=null;info(selected,selected?(coarse?'已选中 · 轻触进入或双指放大':'已选中 · 点击进入或继续靠近'):undefined,!!selected)}});
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();pixelRatio=Math.min(pixelRatio,Math.min(devicePixelRatio||1,2));renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);if(!selected){panoramaTarget();wantedDistance=panoramaDistance()}invalidateLabelLayout()});
 window.addEventListener('resize',()=>{nearStars.material.uniforms.pixelScale.value=renderer.getPixelRatio()});
 window.addEventListener('resize',()=>{dust.material.uniforms.pixelScale.value=renderer.getPixelRatio()});
 const occlusionSphere=new THREE.Sphere(),occlusionHit=new THREE.Vector3(),occlusionDirection=new THREE.Vector3(),labelProjection=new THREE.Vector3(),planetProjection=new THREE.Vector3();let lastFrame=0,frameId=0,motionTime=0,revealTime=0,lastLabelLayout=-Infinity,layoutDirty=true,qualityFrames=0,qualityTime=0;
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(frameId)cancelAnimationFrame(frameId);frameId=0;errorText.textContent='图形上下文丢失，正在尝试恢复…';error.style.display='block'});
 canvas.addEventListener('webglcontextrestored',()=>{error.style.display='none';lastFrame=0;if(!frameId)frameId=requestAnimationFrame(animate)});
 // 仅在尺寸、内容或可见状态变化时读取 DOM；动画帧复用几何与布局对象。
 const fixedBlocks=Array.from(document.querySelectorAll('.top,.guide,.focus,.panel'),element=>({element,left:0,right:0,top:0,bottom:0,visible:false}));
 const layoutItems=works.map(w=>({w,o:byWork.get(w),x:0,y:0,planetX:0,planetY:0,r:0,z:0,dist:0,priority:0,width:0,height:0,visible:false,above:false})),candidates=[],occupied=works.map(()=>({left:0,right:0,top:0,bottom:0}));
 for(const item of layoutItems){item.o.label.style.display='block';item.o.label.style.visibility='hidden'}
 invalidateLabelLayout=()=>{layoutDirty=true};
 function measureLayout(){
  for(const block of fixedBlocks){const element=block.element,style=getComputedStyle(element);block.visible=!element.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&(element===focus?element.classList.contains('visible'):Number(style.opacity)>0);if(!block.visible)continue;const rect=element.getBoundingClientRect();block.left=rect.left;block.right=rect.right;block.top=rect.top;block.bottom=rect.bottom;if(element===focus){block.top-=8;block.bottom+=8}block.visible=rect.width>0&&rect.height>0}
  for(const item of layoutItems){const rect=item.o.label.getBoundingClientRect();item.width=Math.ceil(rect.width);item.height=Math.ceil(rect.height)}
  layoutDirty=false;
 }
 const overlayObserver=new MutationObserver(invalidateLabelLayout);
 for(const block of fixedBlocks){overlayObserver.observe(block.element,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,characterData:true,subtree:true});block.element.addEventListener('transitionend',invalidateLabelLayout);block.element.addEventListener('animationend',invalidateLabelLayout)}
 if(window.ResizeObserver){const sizeObserver=new ResizeObserver(invalidateLabelLayout);for(const block of fixedBlocks)sizeObserver.observe(block.element);for(const item of layoutItems)sizeObserver.observe(item.o.label)}
 if(document.fonts)document.fonts.ready.then(invalidateLabelLayout);
 const candidateOrder=(a,b)=>b.priority-a.priority||a.dist-b.dist;
 function overlaps(left,right,top,bottom,box){return left<box.right+6&&right>box.left-6&&top<box.bottom+6&&bottom>box.top-6}
 function placeLabel(item,x,start,down,occupiedCount){
  let y=start;const half=item.width/2;
  for(let tries=0;tries<fixedBlocks.length+works.length*2+2;tries++){
   if(y<8||y+item.height>innerHeight-8||Math.abs(y-start)>96)return NaN;
   const left=x-half,right=x+half,bottom=y+item.height;let next=y;
   for(const block of fixedBlocks){if(block.visible&&overlaps(left,right,y,bottom,block)){next=down?Math.max(next,block.bottom+8):Math.min(next,block.top-item.height-8)}}
   for(let i=0;i<occupiedCount;i++){const box=occupied[i];if(overlaps(left,right,y,bottom,box)){next=down?Math.max(next,box.bottom+8):Math.min(next,box.top-item.height-8)}}
   for(const other of layoutItems){if(other===item||other.z<=-1||other.z>=1)continue;if(left<other.planetX+other.r+5&&right>other.planetX-other.r-5&&y<other.planetY+other.r+5&&bottom>other.planetY-other.r-5){next=down?Math.max(next,other.planetY+other.r+8):Math.min(next,other.planetY-other.r-item.height-8)}}
   if(next===y)return y;y=next;
  }
  return NaN;
 }
 function layoutLabels(now){
  if(!layoutDirty&&now-lastLabelLayout<1000/30)return;
  if(layoutDirty)measureLayout();lastLabelLayout=now;candidates.length=0;
  const scale=innerHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  for(const item of layoutItems){const o=item.o;item.visible=false;item.dist=camera.position.distanceTo(o.root.position);planetProjection.copy(o.root.position).project(camera);item.planetX=(planetProjection.x+1)*innerWidth/2;item.planetY=(1-planetProjection.y)*innerHeight/2;item.z=planetProjection.z;item.r=o.radius*scale/Math.max(item.dist,.1);if(item.w===selected)continue;labelProjection.copy(o.root.position);labelProjection.y-=o.radius*1.35;labelProjection.project(camera);if(labelProjection.z>=1||labelProjection.z<=-1||Math.abs(labelProjection.x)>=1.08||Math.abs(labelProjection.y)>=1.08||item.dist<=o.radius*2.6)continue;
   raycaster.set(camera.position,occlusionDirection.copy(o.root.position).sub(camera.position).normalize());let blocked=false;for(const other of layoutItems){if(other===item)continue;const b=other.o;occlusionSphere.center.copy(b.root.position);occlusionSphere.radius=b.radius;if(raycaster.ray.intersectSphere(occlusionSphere,occlusionHit)&&camera.position.distanceToSquared(occlusionHit)<(item.dist-o.radius)*(item.dist-o.radius)){blocked=true;break}}if(blocked)continue;
   item.x=(labelProjection.x+1)*innerWidth/2;item.y=(1-labelProjection.y)*innerHeight/2;item.priority=(item.w===selected?2:0)+(item.w===hovered?1:0);candidates.push(item);
  }
  candidates.sort(candidateOrder);let occupiedCount=0;
  for(const item of candidates){if(item.width>innerWidth-16)continue;const x=clamp(item.x,item.width/2+8,innerWidth-item.width/2-8);let y=placeLabel(item,x,item.y,true,occupiedCount);item.above=!Number.isFinite(y);if(item.above)y=placeLabel(item,x,item.planetY-item.r-item.height-10,false,occupiedCount);if(!Number.isFinite(y))continue;item.visible=true;const box=occupied[occupiedCount++];box.left=x-item.width/2;box.right=x+item.width/2;box.top=y;box.bottom=y+item.height;if(item.o.labelX!==x){item.o.label.style.left=x+'px';item.o.labelX=x}if(item.o.labelY!==y){item.o.label.style.top=y+'px';item.o.labelY=y}}
  for(const item of layoutItems){if(item.o.labelVisible!==item.visible){item.o.label.style.visibility=item.visible?'visible':'hidden';item.o.labelVisible=item.visible}const above=!!item.visible&&item.above;if(item.o.labelAbove!==above){item.o.label.classList.toggle('above',above);item.o.labelAbove=above;invalidateLabelLayout()}}
 }
 function animate(now){
  frameId=0;if(document.hidden)return;
  if(reduced.matches&&lastFrame&&now-lastFrame<1000/30){frameId=requestAnimationFrame(animate);return}
  const elapsed=lastFrame?Math.max(0,(now-lastFrame)/1000):1/60,dt=Math.min(elapsed,.08);lastFrame=now;
  const still=reduced.matches,ease=still?1:1-Math.exp(-5.3*dt),motionDecay=Math.exp(-6*dt);if(!still){motionTime+=Math.min(elapsed,.1);revealTime+=elapsed*(selected||hovered||panelOpen||fingers.size>0?3:1)}stars.material.opacity=.64;
  for(const w of works){
   const o=byWork.get(w),goal=w===selected||w===hovered||!panel.hidden||fingers.size>0?0:selected?.18:1;
   if(still){o.motionWeight=goal;o.motionVelocity=0}else{const error=o.motionWeight-goal,step=(o.motionVelocity+6*error)*dt;o.motionWeight=goal+(error+step)*motionDecay;o.motionVelocity=(o.motionVelocity-6*step)*motionDecay}
   if(!still&&entry.work!==w)o.orbitClock+=dt*o.motionWeight;
   // A paused clock holds its position rather than pulling the planet back to origin.
   o.angle=entry.work===w?entry.orbitAngle:o.baseAngle+o.driftAmplitude*(Math.sin(o.orbitClock*o.driftRate+o.driftPhase)-Math.sin(o.driftPhase));
   if(o.reveal<1){const p=still?1:THREE.MathUtils.clamp((revealTime-.12-o.index*.15)/1.4,0,1);o.reveal=p*p*p*(10+p*(-15+6*p));}
   const entrance=1-o.reveal;
   o.root.position.set(Math.cos(o.angle)*o.orbitRadius,Math.sin(o.angle)*o.orbitRadius*o.orbitUp.y,Math.sin(o.angle)*o.orbitRadius*o.orbitUp.z);o.root.position.y-=entrance*.45;o.root.position.z-=entrance*.55;o.root.scale.setScalar(1-entrance*.12);
   if(!still&&entry.work!==w)o.sphere.rotation.y+=dt*o.spinBase*o.motionWeight;
  }
  if(selected)desiredTarget.copy(byWork.get(selected).root.position);
  if(still){yaw=wantedYaw;pitch=wantedPitch;yawVelocity=0;pitchVelocity=0}else{
   const omega=10,decay=Math.exp(-omega*dt),yawError=yaw-wantedYaw,yawStep=(yawVelocity+omega*yawError)*dt,pitchError=pitch-wantedPitch,pitchStep=(pitchVelocity+omega*pitchError)*dt;
   yaw=wantedYaw+(yawError+yawStep)*decay;yawVelocity=(yawVelocity-omega*yawStep)*decay;pitch=wantedPitch+(pitchError+pitchStep)*decay;pitchVelocity=(pitchVelocity-omega*pitchStep)*decay;
  }
  nearStars.material.uniforms.motion.value=still?0:1;nearStars.material.uniforms.time.value=motionTime;nebula.material.uniforms.time.value=motionTime;haze.material.uniforms.time.value=motionTime+7;
  if(!still){stars.rotation.y=motionTime*.0012;nearStars.rotation.y=motionTime*.0008;nearStars.rotation.z=Math.sin(motionTime*.025)*.01;nebula.rotation.z=-.28+Math.sin(motionTime*.025)*.012;haze.rotation.z=.45+Math.sin(motionTime*.018)*.02}
  const ambientEase=still?1:1-Math.exp(-2.8*dt),ambientActive=!selected&&!panelOpen&&!entry.work;
  ambientPointer.x+=((still||!ambientActive?0:ambientPointer.targetX)-ambientPointer.x)*ambientEase;ambientPointer.y+=((still||!ambientActive?0:ambientPointer.targetY)-ambientPointer.y)*ambientEase;
  nearStars.position.set(ambientPointer.x*.4,-ambientPointer.y*.28,0);haze.position.x=-18+ambientPointer.x*1.2;haze.position.y=-8-ambientPointer.y*.8;
  dust.material.uniforms.time.value=motionTime;dust.material.uniforms.opacity.value+=((selected?.035:.16)-dust.material.uniforms.opacity.value)*ambientEase;
  meteor.material.uniforms.time.value=motionTime;meteor.material.uniforms.opacity.value=still||!ambientActive?0:.38;
  if(entry.work){
   if(still){const work=entry.work;cancelEntry();enter(work)}else{
    entry.elapsed+=elapsed;const p=clamp(entry.elapsed/entry.duration,0,1),p2=p*p,p3=p2*p,p4=p3*p,p5=p4*p;
    const travel=10*p3-15*p4+6*p5,momentum=p-6*p3+8*p4-3*p5,span=entry.toLog-entry.fromLog;
    distance=Math.exp(entry.fromLog+span*travel+entry.velocity*momentum);
    zoomVelocity=(span*30*p2*(1-p)*(1-p)+entry.velocity*(1-18*p2+32*p3-15*p4))/entry.duration;
    target.lerpVectors(entry.fromTarget,byWork.get(entry.work).root.position,travel).addScaledVector(entry.targetVelocity,entry.duration*momentum);
    const fade=clamp((p-.22)/.78,0,1);entryVeil.style.opacity=String(fade*fade*(3-2*fade));
    if(p===1){if(entry.opaqueFrame){enter(entry.work,true);return}entry.opaqueFrame=true}
   }
  }else{
   target.lerp(desiredTarget,ease);
   if(still){distance=wantedDistance;zoomVelocity=0}else{
    // Closed-form critically damped spring in log distance: scale-independent, continuous velocity.
    const goal=Math.log(wantedDistance),error=Math.log(distance)-goal,omega=9,decay=Math.exp(-omega*dt),step=(zoomVelocity+omega*error)*dt;
    distance=Math.exp(goal+(error+step)*decay);zoomVelocity=(zoomVelocity-omega*step)*decay;
   }
   if(pendingEntry&&pendingConfirmed&&selected===pendingEntry){const o=byWork.get(pendingEntry);if(target.distanceTo(o.root.position)<o.radius*.2&&distance<o.radius*2.5)beginEntry(pendingEntry)}
  }
  positionCamera();scene.updateMatrixWorld();
  const handoffFade=entry.work?1-THREE.MathUtils.smoothstep(entry.elapsed/entry.duration,.1,.75):1,lightEase=still?1:1-motionDecay;
  for(const w of works){
   const o=byWork.get(w),active=w===hovered||w===selected,highlight=w===selected?1:active?.55:0,muted=!!selected&&w!==selected&&w!==hovered;
   o.highlight+=(highlight-o.highlight)*lightEase;
   if(o.active!==active){if(active&&!still&&o.rippleAge>.7)o.rippleAge=0;o.active=active;o.label.classList.toggle('active',active);invalidateLabelLayout()}
   const labelOpacity=o.reveal*(muted?.45:1);if(o.labelOpacity!==labelOpacity){o.labelOpacity=labelOpacity;o.label.style.opacity=String(labelOpacity)}
   const orbitOpacity=((selected&&w!==selected?.065:.17)+o.highlight*.3)*handoffFade;
   o.orbit.material.uniforms.alpha.value+=(orbitOpacity-o.orbit.material.uniforms.alpha.value)*lightEase;
   o.orbit.material.uniforms.time.value=motionTime;o.orbit.material.uniforms.moving.value=still?0:selected?.18:1;o.orbit.material.uniforms.reveal.value=still?1:Math.max(o.orbit.material.uniforms.reveal.value,THREE.MathUtils.smoothstep(revealTime-o.index*.15,0,2.1));
   o.trace.rotation.z=o.angle;o.trace.material.opacity+=(o.highlight*.62*handoffFade-o.trace.material.opacity)*lightEase;o.trace.visible=o.trace.material.opacity>.001;
   const pulse=still||selected||entry.work?1:.72+Math.sin(motionTime*.85+o.baseAngle)*.1;
   o.marker.position.set(Math.cos(o.angle+.48)*o.orbitRadius,Math.sin(o.angle+.48)*o.orbitRadius,0);o.marker.material.opacity+=((.12+o.highlight*.52)*pulse*handoffFade-o.marker.material.opacity)*lightEase;o.marker.visible=o.marker.material.opacity>.001;
   o.selectionRing.scale.setScalar(1+(1-o.highlight)*.045);o.selectionRing.material.opacity+=(o.highlight*.24*handoffFade-o.selectionRing.material.opacity)*lightEase;o.selectionRing.visible=o.selectionRing.material.opacity>.001;o.selectionRing.quaternion.copy(camera.quaternion);
   o.rippleAge+=still?2:dt;const rippleProgress=THREE.MathUtils.clamp(o.rippleAge/1.1,0,1);o.ripple.visible=rippleProgress<1&&!entry.work;o.ripple.quaternion.copy(camera.quaternion);o.ripple.scale.setScalar(o.radius*(1.12+rippleProgress*.48));o.ripple.material.opacity=.16*(1-rippleProgress)*(1-rippleProgress);
   o.sphere.material.roughness=1-o.highlight*.045;o.sphere.material.envMapIntensity=o.envBase*(1+o.highlight*.08);o.sphere.material.emissiveIntensity=o.highlight*.012;o.glow.material.opacity=.04+o.highlight*.06;
  }
  layoutLabels(now);
  if(!still){qualityFrames++;qualityTime+=elapsed;if(qualityFrames>=90){const average=qualityTime/qualityFrames;if(average>.036&&pixelRatio>1){pixelRatio=Math.max(1,pixelRatio-.25);renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);nearStars.material.uniforms.pixelScale.value=pixelRatio;dust.material.uniforms.pixelScale.value=pixelRatio;invalidateLabelLayout()}qualityFrames=0;qualityTime=0}}
  renderer.render(scene,camera);frameId=requestAnimationFrame(animate);
 }
 window.addEventListener('pageshow',e=>{entering=false;cancelEntry();zoomVelocity=0;setPanel(false);if(e.persisted){resetCamera();distance=wantedDistance;target.copy(desiredTarget);yaw=wantedYaw;pitch=wantedPitch;yawVelocity=0;pitchVelocity=0;positionCamera()}if(!frameId)frameId=requestAnimationFrame(animate)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;lastFrame=0}else if(!frameId){lastFrame=0;frameId=requestAnimationFrame(animate)}});
 positionCamera();scene.updateMatrixWorld();renderer.render(scene,camera);lastFrame=performance.now();setSceneReady(true);frameId=requestAnimationFrame(animate);
 const hashWork=/^#work-(\d+)$/.exec(location.hash);if(hashWork){const hashSelection=works[Number(hashWork[1])-1];if(hashSelection)selectPlanet(hashSelection)}
 window.addEventListener('hashchange',()=>{const match=/^#work-(\d+)$/.exec(location.hash),work=match?works[Number(match[1])-1]:null;if(work){if(work!==selected)selectPlanet(work)}else if(selected)resetCamera()});
}catch(err){setSceneReady(false);console.error(err);const boot=document.getElementById('boot');if(boot)boot.hidden=true;errorText.textContent=err.message==='作品数据未加载'?'作品数据未加载：请确认 作品数据.js 与展厅在同一目录。':err.message==='Three.js 未加载'?'三维库未加载：请确认 three.min.js 与展厅在同一目录。':'三维场景不可用，请从作品目录进入。';error.style.display='block'}
}
requestAnimationFrame(()=>setTimeout(startScene,0));
})();