/* Numerical and limiting-case checks for the actual interactive experiment models. */
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../lecture_factory/courses_web/analytical-mechanics/assets/sim-physics.js');
const near = (a,b,t=1e-8) => assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('nonlinear pendulum and rotating-ring integration conserve their motion integrals',()=>{
  for(const mode of ['pendulum','ring']){
    let q=mode==='pendulum'?.8:0,v=mode==='ring'?1:0;
    const energy=(q,v)=>mode==='pendulum'?P.pendulum(1,1,q,v).T+P.pendulum(1,1,q,v).V:P.ring(1,1,q,v).invariant;
    const acceleration=(q,v)=>mode==='pendulum'?P.pendulum(1,1,q,v).acceleration:P.ring(1,1,q,v).acceleration;
    const initial=energy(q,v);
    for(let i=0;i<60*240;i++)[q,v]=P.rk4(q,v,1/240,acceleration);
    near(energy(q,v),initial,1e-7);
  }
});
test('top-pulled rolling bodies satisfy both Newton equations and friction limits',()=>{
  const disk=P.rolling(1,1,.5);near(disk.acceleration,4/3);near(disk.friction,1/3);
  for(const k of [.25,.5,1]){
    const r=P.rolling(2,3,k);near(2*r.acceleration,3+r.friction);
    near(2*k*.5*r.acceleration,(3-r.friction)*.5);
    near(r.minMu,Math.abs(r.friction)/(2*P.g));
  }
});
test('massive Atwood pulley has the correct tension torque and limiting behavior',()=>{
  for(const M of [0,1,5]){
    const r=P.atwood(1,2,M);near(r.T2-r.T1,(M/2)*r.acceleration);
  }
  near(P.atwood(1,2,0).acceleration,P.g/3);
  near(P.atwood(2,2,3).acceleration,0);
  assert.ok(P.atwood(1,2,4).acceleration<P.atwood(1,2,1).acceleration);
  assert.ok(P.atwood(2,1,1).acceleration<0);
});
test('moving wedge conserves horizontal momentum and approaches a fixed slope',()=>{
  const alpha=Math.PI/6,w=P.wedge(1,3,alpha);
  near(4*w.xAcceleration+w.sAcceleration*Math.cos(alpha),0);
  near(w.sAcceleration+w.xAcceleration*Math.cos(alpha),P.g*Math.sin(alpha));
  near(P.wedge(1,1e10,alpha).sAcceleration,P.g*Math.sin(alpha));
});
test('chain separates static-start threshold from kinetic acceleration',()=>{
  assert.equal(P.chain(2,.2,.3,.1,0).canStart,false);
  assert.equal(P.chain(2,.2,.3,1,0).canStart,true);
  near(P.chain(2,.2,.3,1,0).acceleration,P.g*.4);
  near(P.chain(2,.2,.3,2,1).acceleration,P.g);
});

test('moving-support virtual displacement fixes time and matches the lesson numbers',()=>{
 const th=Math.PI/6,dth=2*Math.PI/180;
 const a=P.virtual(1,th,dth,0,.12),b=P.virtual(1,th,dth,1,.12);
 near(a.deltaX,b.deltaX);near(a.deltaY,b.deltaY);near(b.actualX-a.actualX,.12);
 near(Math.sin(th)*a.deltaX-Math.cos(th)*a.deltaY,0);
 near(a.deltaX,.0302299894,1e-9);near(b.actualX,.1502299894,1e-9);
});
test('Atwood motion solves Newton and preserves full-system mechanical energy',()=>{
 for(const [m1,m2,M] of [[1,2,0],[1,2,1],[1,2,4],[2,1,3],[2,2,5]]){
  const r=P.atwood(m1,m2,M),mEff=m1+m2+M/2;
  near(r.T1-m1*P.g,m1*r.acceleration);near(m2*P.g-r.T2,m2*r.acceleration);
  near(r.T2-r.T1,M/2*r.acceleration);assert.ok(r.T1>0&&r.T2>0);
  let x=0,v=0;for(let i=0;i<60;i++)[x,v]=P.rk4(x,v,1/240,()=>r.acceleration);
  near(x,.5*r.acceleration*.25**2);near(v,r.acceleration*.25);
  near(.5*mEff*v*v+(m1-m2)*P.g*x,0);
 }
});
