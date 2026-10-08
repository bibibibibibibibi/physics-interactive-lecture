/** sp4 candidate-only bridge. Inject after the frozen sim_standing.html script.
 * Formal input: shared lecture-state, whose anchors originate in real stepTimes.
 * Explicit legacy lecture-clock inputs remain only in isolated engine tests.
 */
(() => {
  'use strict';
  const api=window.standingLab;
  if(!api||typeof api.lectureClock!=='function'||typeof api.setDemo!=='function')throw new Error('sp4 standing-wave engine missing before lecture-state adapter');
  if(document.getElementById('static-demo-toggle'))return; // Avoid duplicate injection on the same document.
  const view=api.getState().view;
  const demoMap={formation:{kind:'standing',step:2},phase:{kind:'phase',step:2},modes:{kind:'modes',step:2},microwave:{kind:'microwave',step:3}};
  const expected=demoMap[view]||null;
  // The frozen source's n=1 hot-spot glow rectangles extend past the chocolate.
  // Clip only these fillRect draws to its existing rounded chocolate outline;
  // retain all source formulas, parameters, controls, labels and measurement.
  if(view==='microwave'){
    const canvas=document.getElementById('microwave'),context=canvas.getContext('2d'),fillRect=context.fillRect.bind(context);
    context.fillRect=(x,y,w,h)=>{const rect=canvas.getBoundingClientRect(),W=Math.max(rect.width,280),H=rect.height||300;const isHotspotGlow=context.fillStyle instanceof CanvasGradient&&Math.abs(y-45)<1e-8&&Math.abs(h-(H-126))<1e-8;if(!isHotspotGlow){fillRect(x,y,w,h);return}context.save();context.beginPath();context.roundRect(45,37,W-80,H-110,15);context.clip();fillRect(x,y,w,h);context.restore()};
  }
  let last=null,automatic=null,animationFrame=null;
  const status=document.getElementById('play-status');
  const button=document.createElement('button');
  button.id='static-demo-toggle';button.type='button';button.textContent='自动对照';button.hidden=true;
  document.getElementById('play-toggle').before(button);
  const nearly=(a,b)=>Math.abs(a-b)<1e-6;
  const allowed=()=>Boolean(last?.mode==='static'&&expected&&last.step>=expected.step&&last.anchor!==null);
  function renderStatus(){
    button.hidden=!allowed();button.textContent=automatic?'暂停对照':'自动对照';button.setAttribute('aria-pressed',String(Boolean(automatic)));
    if(last?.mode==='static'){
      const text=last.missingAnchor?'演示起点待校准':automatic?'静态 · 自动对照':api.getState().playing?'静态 · 波形播放':'静态 · 可手动';
      if(status.textContent!==text)status.textContent=text;
    }
  }
  function stopAutomatic(){if(animationFrame!==null)cancelAnimationFrame(animationFrame);animationFrame=null;automatic=null;renderStatus()}
  function applyDemo(snapshot,contextChanged){
    const current=api.getState().demo;
    if(contextChanged)api.reset();
    if(expected&&snapshot.step>=expected.step&&snapshot.anchor!==null){
      if(contextChanged||current?.kind!==expected.kind||!nearly(current?.start??-1,snapshot.anchor))api.setDemo(expected.kind,snapshot.anchor);
    }else if(current!==null&&!contextChanged)api.reset();
    api.lectureClock(snapshot.time,snapshot.playing);
  }
  function receive(data){
    if(!data||data.type!=='lecture-state'||!['interactive','static'].includes(data.mode))return;
    const time=data.pageTime,step=data.step;
    if(!Number.isFinite(time)||time<0||!Number.isInteger(step)||step<0||data.pageId===undefined||!data.steps||typeof data.steps!=='object')return;
    const anchorValue=expected?data.steps[String(expected.step)]:NaN;
    const anchor=typeof anchorValue==='number'&&Number.isFinite(anchorValue)&&anchorValue>=0?anchorValue:null;
    const signature=JSON.stringify(Object.entries(data.steps).sort((a,b)=>Number(a[0])-Number(b[0])));
    const snapshot={mode:data.mode,pageId:String(data.pageId),time,step,anchor,playing:data.mode==='interactive'&&Boolean(data.playing),signature,missingAnchor:Boolean(expected&&step>=expected.step&&anchor===null)};
    const contextChanged=!last||last.mode!==snapshot.mode||last.pageId!==snapshot.pageId||last.step!==step||last.signature!==signature;
    const timeChanged=!last||!nearly(last.time,time),resuming=snapshot.playing&&!last?.playing,playingChanged=!last||last.playing!==snapshot.playing;
    // Identical paused snapshots must preserve a student/teacher's manual state.
    // They also must not restart a locally requested static comparison.
    if(!contextChanged&&!timeChanged&&!playingChanged&&!snapshot.playing){last=snapshot;renderStatus();return}
    if(contextChanged||timeChanged||resuming)stopAutomatic();
    last=snapshot;
    applyDemo(snapshot,contextChanged);
    document.body.dataset.lectureMode=snapshot.mode;
    document.body.dataset.lecturePageId=snapshot.pageId;
    document.body.dataset.lectureStep=String(snapshot.step);
    document.body.dataset.lectureSync=snapshot.missingAnchor?'missing-anchor':'ready';
    renderStatus();
  }
  function startAutomatic(){
    if(!allowed())return;
    stopAutomatic();
    api.reset();api.setDemo(expected.kind,last.anchor);api.lectureClock(last.anchor,false);
    automatic={began:performance.now(),anchor:last.anchor};renderStatus();
    const animate=now=>{
      if(!automatic)return;
      // Local elapsed time animates an explicitly requested static comparison;
      // it is never an estimate of narration or a replacement audio timeline.
      api.lectureClock(automatic.anchor+Math.max(0,(now-automatic.began)/1000),false);
      renderStatus();animationFrame=requestAnimationFrame(animate);
    };
    animationFrame=requestAnimationFrame(animate);
  }
  button.addEventListener('click',()=>automatic?stopAutomatic():startAutomatic());
  const interruptForManual=event=>{
    if(!automatic||event.target===button)return;
    const target=event.target;
    if(target instanceof Element&&target.closest('input,select,[data-preset],#standing,#play-toggle,#step-back,#step-forward,#reset'))stopAutomatic();
  };
  document.addEventListener('pointerdown',interruptForManual,true);
  document.addEventListener('input',interruptForManual,true);
  document.addEventListener('change',interruptForManual,true);
  document.addEventListener('click',interruptForManual,true);
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==window.location.origin)return;
    receive(event.data);
  });
  // Source-engine drawing refreshes its legacy status line. Keep the static label
  // descriptive while leaving all physics, controls and reset in that engine.
  new MutationObserver(renderStatus).observe(status,{childList:true,characterData:true,subtree:true});
})();
