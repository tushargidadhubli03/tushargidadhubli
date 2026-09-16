export const INITIAL_BALL={x:-2.7,y:.6,vx:0,vy:0};
export function shotPoint(angle,power,t){const r=angle*Math.PI/180;return [INITIAL_BALL.x+Math.cos(r)*power*t,INITIAL_BALL.y+Math.sin(r)*power*t-4.9*t*t,0]}
export function stepBall(b,dt){return {...b,x:b.x+b.vx*dt,y:b.y+b.vy*dt-4.9*dt*dt,vy:b.vy-9.8*dt}}
