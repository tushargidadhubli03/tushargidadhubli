import {useState,useEffect,useRef,useCallback,useSyncExternalStore,lazy,Suspense, useMemo} from 'react';
import {ArrowUpRight,ArrowDown,ArrowRight,ArrowUp,X,Menu,Pause,Play,Shuffle,Check,Compass,Headphones,Mail,Copy,Wind,Boxes} from 'lucide-react';
import {profile,books,readingNow} from './content.js';
import {chapters,fullStory,capabilities,storyCounter} from './narrative.js';
import {HoopGame} from './Interactions.jsx';
import Career from './Career.jsx';
import Urbanysis from './Urbanysis.jsx';
import BeatMachine from './BeatMachine.jsx';
import Diya from './Diya.jsx';
import Unfold from './Unfold.jsx';
import {ResumeGag,ProToggle,ProBanner, GagSheet} from './Extras.jsx';
import Decisions from './Decisions.jsx';
import PrintResume from './PrintResume.jsx';
import Interview from './Interview.jsx';
import Speedrun from './Speedrun.jsx';
import Hour from './Hour.jsx';
import {noteChapter,notePlayed,closingLine,subscribeVisit} from './visit.js';
import {Dual,Paragraphs,AxisControl,AxisInvitation,useSide} from './Perspective.jsx';
import {frame,advance,setActiveChapter,subscribeChapter,setAxis,setTargets} from './state.js';
import {stageHeight} from './scene-layout.js';
const World=lazy(()=>import('./World.jsx'));
const LandingKoi=lazy(()=>import('./LandingKoi.jsx'));

function useMotion(){const [motion,setMotion]=useState(()=>typeof window==='undefined'||!window.matchMedia('(prefers-reduced-motion: reduce)').matches);return [motion,setMotion]}
function useActiveChapter(){return useSyncExternalStore(subscribeChapter,()=>frame.active,()=>'home')}

function MusicPlayer(){const [loaded,setLoaded]=useState(false);return <div className="listening-room"><div className="listening-heading"><Headphones size={19}/><span>Hip-hop &amp; indie. By dhubli.</span></div>{loaded?<iframe title="dhubli on Spotify" src={`https://open.spotify.com/embed/artist/${profile.spotifyId}?theme=0`} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{border:0,borderRadius:8}}/>:<button className="spotify-activate" onClick={()=>setLoaded(true)}><span className="play-circle"><Play fill="currentColor" size={24}/></span><strong>Put something on.</strong><small>Open the Spotify listening room</small></button>}<a href={profile.spotify} target="_blank" rel="noreferrer" className="text-link">Listen on Spotify <ArrowUpRight size={16}/></a><p className="fine-print">If the player is unavailable, the Spotify link opens the artist page. Playback depends on Spotify and your region.</p></div>}

function ReadingNotes(){
  const [index,setIndex]=useState(0);const b=books[index];
  return <div className="reading-notes">
    <p className="reading-now"><span>Reading now</span><strong>{readingNow.title}</strong><em>{readingNow.author}</em></p>
    <div className="book-picker" role="group" aria-label="Choose a book">{books.map((bk,i)=><button key={bk.id} aria-pressed={i===index} className={i===index?'selected':''} onClick={()=>setIndex(i)}>{bk.title}<span>{bk.author}</span></button>)}</div>
    <article className="reading-note" key={b.id}><span className="eyebrow">{b.label}</span><h3>{b.word}</h3>
      <Dual conviction={<p>{b.text}</p>} doubt={b.counter?<p>{b.counter}</p>:null}/>
    </article>
  </div>;
}

// A chapter on the rail is a title card the width of the screen, followed by its prose
// flowing into columns. The 3D artifact sits behind the title card and fades as you move
// into the reading, so the object introduces the chapter rather than competing with it.
//
// Each panel carries its own palette as local custom properties. On a horizontal rail two
// chapters are on screen at once during a transition, so a single global token set would
// paint one chapter's text in the other chapter's colour.
function themeVars(theme){
  return {
    '--ground':theme.ground,'--fg':theme.ink,'--dim':theme.muted,
    '--accent':theme.accent,'--surface':theme.surface,'--hair':theme.line,
  };
}

/* Titles arrive letter by letter, which means every letter has to be its own inline-block —
   and an inline-block is a line-break opportunity. Splitting a title on characters alone
   therefore let the browser break a line in the middle of a word, which is exactly what it
   did. Words are wrapped first and pinned with nowrap; the letters animate inside them. */
function splitTitle(title){
  let n = 0;
  return title.split(/(\s+)/).map((chunk, w) => {
    if (!chunk) return null;
    if (!chunk.trim()) return ' ';
    return (
      <span className="word" key={w} aria-hidden="true">
        {[...chunk].map((ch, c) => (
          <span className="ch" key={c} style={{'--i': n++}}>{ch}</span>
        ))}
      </span>
    );
  });
}

function SceneSection({id,title,children,className='',lead,scale='md'}){
  const chapter=chapters.find(c=>c.id===id);
  return <section id={id} className={`journey-section mood-${chapter.theme.mood} ${className}`}
    data-scene={id} aria-labelledby={`${id}-title`} style={themeVars(chapter.theme)}>
    <div className="panel-title">
      <h2 id={`${id}-title`} tabIndex={-1} className={`chapter-title scale-${scale}`} aria-label={typeof title==='string'?title:undefined}>
        {typeof title==='string' ? splitTitle(title) : title}
      </h2>
      {lead&&<p className="lead">{lead}</p>}
    </div>
    <div className="chapter-copy">{children}</div>
  </section>;
}

const PERSONAL=['story','music','mind','india','play','future'];

export default function App(){
  const active=useActiveChapter();
  const side=useSide();
  const [motion,setMotion]=useMotion(),[menu,setMenu]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[visited,setVisited]=useState(['home']),[reading,setReading]=useState(false),[build,setBuild]=useState(false),[pro,setPro]=useState(false),[resume,setResume]=useState(false),[interview,setInterview]=useState(false),[speedrun,setSpeedrun]=useState(false),[meditating,setMeditating]=useState(false),[breathPhase,setBreathPhase]=useState(''),[copied,setCopied]=useState(false);
  const page=useRef(),dialog=useRef(),openingCopy=useRef(),rail=useRef(),runway=useRef();
  const motionOn=useRef(true);
  useEffect(()=>{motionOn.current=motion},[motion]);
  // Which pointer the reader is scrolling with. A touch anywhere switches to touch pacing; a
  // wheel switches back, so a laptop with a touchscreen behaves correctly either way.
  const touchInput=useRef(false);
  useEffect(()=>{
    const touch=()=>{touchInput.current=true},wheel=()=>{touchInput.current=false};
    window.addEventListener('touchstart',touch,{passive:true});
    window.addEventListener('wheel',wheel,{passive:true});
    return()=>{window.removeEventListener('touchstart',touch);window.removeEventListener('wheel',wheel)};
  },[]);
  // Declared after the state it reads: `pro` is a const, so reading it earlier is a TDZ error.
  // Memoised: this array is a prop on components that key effects off it, and rebuilding it
  // on every render restarted those effects continuously.
  const visibleChapters=useMemo(()=>chapters.filter(c=>!pro||!PERSONAL.includes(c.id)),[pro]);
  const geo=useRef([]),bar=useRef();
  const closing=useSyncExternalStore(subscribeVisit,closingLine,closingLine);

  // On a horizontal track, "go to a chapter" means scrolling the runway to the vertical
  // position whose transform brings that panel to the left edge.
  const navigate=useCallback(id=>{
    const target=document.getElementById(id),el=rail.current;
    if(!target||!el)return;
    setMenu(false);window.history.pushState(null,'',`#${id}`);
    const span=Math.max(1,el.scrollWidth-window.innerWidth);
    const doc=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const y=Math.max(0,Math.min(doc,(target.offsetLeft/span)*doc));
    // Instant, always. The browser's own smooth scroll would be a second easing running on
    // top of the rail's damping, and two smoothings stacked read as lag rather than polish.
    // Jumping the scrollbar and letting the rail glide to it is one animation, not two.
    window.scrollTo({top:y,behavior:'instant'});
    if(id!=='home')setTimeout(()=>document.getElementById(`${id}-title`)?.focus({preventScroll:true}),motion?800:0);
  },[motion]);

  // Hero measurement. Width and copy height only — never height alone, so a mobile address
  // bar collapsing does not retrigger layout mid-scroll.
  useEffect(()=>{const el=openingCopy.current;let lastWidth=0,lastCopyHeight=0;const measure=()=>{const h=Math.ceil(el.getBoundingClientRect().height),width=window.innerWidth;if(width===lastWidth&&h===lastCopyHeight)return;lastWidth=width;lastCopyHeight=h;document.documentElement.style.setProperty('--opening-copy-height',`${h}px`);document.documentElement.style.setProperty('--artifact-stage-height',`${stageHeight(width,window.innerHeight,h)}px`);
      const name=document.querySelector('.hero-name');
      if(name){const r=name.getBoundingClientRect(),root=document.documentElement;
        root.style.setProperty('--name-cx',`${Math.round(r.left+r.width/2)}`);
        root.style.setProperty('--name-cy',`${Math.round(r.top+r.height/2)}`);
        root.style.setProperty('--name-w',`${Math.round(r.width)}`);
        root.style.setProperty('--name-h',`${Math.round(r.height)}`);}
      };const observer=new ResizeObserver(measure);observer.observe(el);window.addEventListener('resize',measure);document.fonts.ready.then(measure);measure();return()=>{observer.disconnect();window.removeEventListener('resize',measure)}},[]);

  useEffect(()=>{setTargets({bar:bar.current,hero:document.querySelector('.hero-name')})},[]);

  useEffect(()=>{const r=document.documentElement;r.dataset.motion=motion?'on':'off';r.dataset.reading=reading?'on':'off';r.dataset.build=build?'on':'off';r.dataset.pro=pro?'on':'off';frame.reduced=!motion;
    if(pro!==undefined)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  },[motion,reading,build,pro]);

  // ---- THE RAIL ------------------------------------------------------------------------
  // Prose flows into columns so a chapter grows sideways instead of down. A multi-column box
  // with an auto width does NOT expand to fit its content — it caps and overflows — so the
  // column count is computed from the real content height and the width is set explicitly.
  // Then the runway is given exactly enough height to travel the finished track, which keeps
  // the document height constant and the scroll free of jumps.
  useEffect(()=>{
    const layout=()=>{
      const el=rail.current,run=runway.current;
      if(!el||!run)return;
      const gap=window.innerWidth*0.05;
      const colW=Math.min(480,Math.max(300,window.innerWidth*0.34));
      for(const copy of el.querySelectorAll('.chapter-copy')){
        // Measure the prose unfragmented and at full height. A multi-column box reports its
        // own fixed height, not the height its content wants, so it cannot be measured while
        // it is still a multi-column box.
        copy.style.columnCount='auto';
        copy.style.columnWidth='auto';
        copy.style.height='auto';
        copy.style.width=`${colW}px`;
        const cs=getComputedStyle(copy);
        const padY=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
        const natural=Math.max(1,copy.scrollHeight-padY);
        copy.style.height='';
        const avail=Math.max(160,copy.clientHeight-padY);
        let count=Math.max(1,Math.min(16,Math.ceil(natural/avail)));
        const setCols=n=>{copy.style.columnCount=String(n);copy.style.width=`${n*colW+(n-1)*gap}px`;};
        setCols(count);
        // The estimate rounds up, so a chapter can be handed a column it never fills — which
        // is where the stretches of empty screen between chapters were coming from. Try the
        // narrower layout; keep it only if the content still fits without overflowing.
        while(count>1){
          setCols(count-1);
          if(copy.scrollWidth-copy.clientWidth>1){setCols(count);break;}
          count--;
        }
        // Blocks that refuse to split can force more columns than the estimate, which used
        // to push a chapter over the top of the next one. Grow to whatever it really needs.
        for(let pass=0;pass<3;pass++){
          const over=copy.scrollWidth-copy.clientWidth;
          if(over<=1)break;
          copy.style.width=`${copy.clientWidth+over+gap}px`;
        }
        // Whatever is left over after the solver is dead space at the end of the chapter.
        // Trim the box back to the real right edge of its content.
        let far=0;
        for(const kid of copy.children){
          for(const r of kid.getClientRects()) far=Math.max(far,r.right);
        }
        if(far>0){
          const slack=copy.getBoundingClientRect().right-parseFloat(getComputedStyle(copy).paddingRight)-far;
          if(slack>colW*0.35) copy.style.width=`${copy.clientWidth-slack+colW*0.12}px`;
        }
      }
      const span=Math.max(0,el.scrollWidth-window.innerWidth);
      run.style.height=`${span+window.innerHeight}px`;
      // Cache every panel's geometry here, once. Reading offsetLeft inside the frame loop
      // forces a synchronous layout on every frame — with nine panels read twice each, that
      // was the entire source of the scroll lag.
      geo.current=chapters.map(c=>{
        const node=document.getElementById(c.id);
        if(!node||!node.offsetParent)return null;
        return {id:c.id,node,left:node.offsetLeft,width:node.offsetWidth};
      }).filter(Boolean);
    };
    let pending=0;
    const schedule=()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(layout)};
    window.addEventListener('resize',schedule);
    document.fonts.ready.then(schedule);
    const t1=setTimeout(schedule,300),t2=setTimeout(schedule,1200);
    schedule();
    return()=>{window.removeEventListener('resize',schedule);cancelAnimationFrame(pending);clearTimeout(t1);clearTimeout(t2)};
  },[]);

  // ---- THE SINGLE FRAME LOOP ------------------------------------------------------------
  // Scroll writes to a plain ref. One rAF loop reads it, moves the track with a transform,
  // advances the damped values and publishes to CSS. React hears about the active chapter and
  // nothing else, so no scroll position can trigger a render.
  useEffect(()=>{
    let lastY=window.scrollY,pendingY=window.scrollY,raf=0,lastT=performance.now(),lastProg=-1;
    // Read through a ref so changing the motion setting never rebuilds the loop.
    frame.ease=frame.page=Math.max(0,Math.min(1,window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)));
    const onScroll=()=>{pendingY=window.scrollY};
    const loop=now=>{
      raf=requestAnimationFrame(loop);
      const dt=Math.min(0.05,(now-lastT)/1000)||0.016;lastT=now;
      const h=window.innerHeight,y=pendingY;
      const doc=Math.max(1,document.documentElement.scrollHeight-h);
      frame.velocity+=(y-lastY)/Math.max(1,h)*2.2;lastY=y;
      frame.page=Math.max(0,Math.min(1,y/doc));

      // A wheel does not scroll continuously — it fires in discrete jumps of roughly a
      // hundred pixels. Mapping that straight onto the rail means the rail jumps too, which
      // is what "not smooth" actually was: not a dropped frame, a stepped input. The rail is
      // drawn at a damped follower of the scroll position instead, so each wheel notch
      // becomes a short glide and a trackpad flick becomes one long one. Everything visual
      // reads the follower, so nothing disagrees with anything else about where we are.
      // Damping is the right answer for a wheel, which arrives in discrete jumps, and the
      // wrong answer for a touch, which is already continuous and carries its own momentum —
      // easing that a second time just feels like the page is lagging behind your thumb. So
      // the constant follows the input the reader is actually using.
      const lambda=touchInput.current?42:9.5;
      frame.ease=motionOn.current
        ? frame.ease+(frame.page-frame.ease)*(1-Math.exp(-lambda*dt))
        : frame.page;
      if(Math.abs(frame.page-frame.ease)<0.00002)frame.ease=frame.page;

      const el=rail.current;if(!el)return;
      const span=Math.max(0,el.scrollWidth-window.innerWidth);
      const x=-frame.ease*span;
      el.style.transform=`translate3d(${x}px,0,0)`;

      // Which chapter is under the middle of the screen? All from cached geometry — the
      // loop performs no layout reads and touches no attributes.
      const mid=-x+window.innerWidth*0.42;
      const panels=geo.current;
      let id=panels[0]?.id||'home',best=Infinity,prog=0;
      for(const g of panels){
        if(mid>=g.left&&mid<g.left+g.width){id=g.id;prog=(mid-g.left)/Math.max(1,g.width);break}
        const dd=Math.min(Math.abs(mid-g.left),Math.abs(mid-(g.left+g.width)));
        if(dd<best){best=dd;id=g.id;prog=mid<g.left?0:1}
      }
      frame.progress=Math.max(0,Math.min(1,prog));
      if(Math.abs(frame.progress-lastProg)>0.006){
        lastProg=frame.progress;
        // Both of these used to go on the root element, which meant every frame of a scroll
        // recalculated the style of every node in the document.
        const fade=id==='home'?1:Math.max(0,Math.min(1,1-(frame.progress-0.05)*7));
        const cinema=document.querySelector('.cinema');
        if(cinema){cinema.style.setProperty('--artifact-opacity',fade.toFixed(3));cinema.style.setProperty('--chapter-progress',frame.progress.toFixed(3))}
      }

      // Entrance. Only panels actually near the screen are touched, and only when the value
      // has moved enough to be visible — a custom-property write on a panel invalidates style
      // for everything inside it, so these are expensive and must be rationed.
      const vw=window.innerWidth;
      for(const g of panels){
        const screenLeft=g.left+x;
        if(screenLeft>vw*1.15||screenLeft+g.width<-vw*0.15){
          if(g.enter!==0){g.enter=0;g.in=false;g.node.classList.remove('is-in')}
          continue;
        }
        const span2=Math.min(g.width,vw*0.8);
        const enter=Math.max(0,Math.min(1,(vw-screenLeft)/span2));
        const exit=Math.max(0,Math.min(1,-screenLeft/Math.max(1,g.width-vw*0.5)));
        if(g.enter===undefined||Math.abs(enter-g.enter)>0.015){
          g.enter=enter;
          // The only per-frame style write left on the rail. --exit is registered
          // non-inheriting, so this invalidates this one element rather than its subtree.
          g.node.style.setProperty('--exit',exit.toFixed(3));
        }
        // The reading gets a one-off class instead of a per-frame value: same effect, one
        // style invalidation per chapter rather than one per frame.
        const shouldBeIn=enter>0.26;
        if(g.in!==shouldBeIn){g.in=shouldBeIn;g.node.classList.toggle('is-in',shouldBeIn)}
      }
      advance(dt);
      if(id!==frame.active)setActiveChapter(id);
    };
    const onPointer=e=>{
      frame.px=(e.clientX/window.innerWidth)*2-1;
      frame.py=-((e.clientY/window.innerHeight)*2-1);
      frame.pointerSeen=true;
    };
    const onLeave=()=>{frame.pointerSeen=false};
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('pointermove',onPointer,{passive:true});
    window.addEventListener('pointerdown',onPointer,{passive:true});
    document.addEventListener('pointerleave',onLeave);
    raf=requestAnimationFrame(loop);
    return()=>{
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('pointermove',onPointer);
      window.removeEventListener('pointerdown',onPointer);
      document.removeEventListener('pointerleave',onLeave);
      cancelAnimationFrame(raf);
    };
  },[]);

  useEffect(()=>{
    setVisited(v=>v.includes(active)?v:[...v,active]);
    noteChapter(active);
    const c=chapters.find(c=>c.id===active),r=document.documentElement,t=c.theme;
    r.style.setProperty('--ground',t.ground);r.style.setProperty('--fg',t.ink);
    r.style.setProperty('--dim',t.muted);r.style.setProperty('--accent',t.accent);
    r.style.setProperty('--surface',t.surface);r.style.setProperty('--hair',t.line);
    r.dataset.mood=t.mood;
    document.title=active==='home'?'Tushar Gidadhubli':`${c.label} — Tushar Gidadhubli`;
  },[active]);

  // Deep links carry chapter and perspective: #work or #work@0.6
  useEffect(()=>{
    const follow=()=>{const raw=location.hash.slice(1);if(!raw)return;const [id,ax]=raw.split('@');const target=document.getElementById(id);if(ax!==undefined&&!Number.isNaN(Number(ax)))setAxis(Number(ax),{immediate:true});if(target)target.scrollIntoView({behavior:'instant',block:'start'})};
    const t=setTimeout(follow,200);window.addEventListener('popstate',follow);
    return()=>{clearTimeout(t);window.removeEventListener('popstate',follow)};
  },[]);

  useEffect(()=>{if(!menu)return;const el=dialog.current,previous=document.activeElement;el.querySelector('button')?.focus();const handle=e=>{if(e.key==='Escape')setMenu(false);if(e.key!=='Tab')return;const controls=el.querySelectorAll('button,a,input');if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls[controls.length-1].focus()}else if(!e.shiftKey&&document.activeElement===controls[controls.length-1]){e.preventDefault();controls[0].focus()}};document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);previous?.focus?.({preventScroll:true})}},[menu]);

  useEffect(()=>{if(!meditating)return;const start=performance.now();setBreathPhase('Breathe in.');const timer=setInterval(()=>{const t=performance.now()-start;if(t>10000){setMeditating(false);setBreathPhase('A little more here.');clearInterval(timer)}else if(t>4000)setBreathPhase('Breathe out.')},200);return()=>clearInterval(timer)},[meditating]);

  const wander=()=>{const base=visibleChapters;const options=base.filter(c=>c.id!=='home'&&c.id!=='contact'&&c.id!==active&&!visited.includes(c.id));const pool=options.length?options:base.filter(c=>c.id!==active);if(pool.length)navigate(pool[Math.floor(Math.random()*pool.length)].id)};
  const onReady=useCallback(()=>setReady(true),[]),onFail=useCallback(()=>{setFailed(true);setReady(true)},[]);
  // Which of the two sheets the printer gets. Set on the root element so the print
  // stylesheet can pick one and hide the other; cleared once the dialog is done with.
  const printSheet=kind=>{notePlayed('printed');document.documentElement.dataset.print=kind;setTimeout(()=>{window.print();setTimeout(()=>{delete document.documentElement.dataset.print},400)},60)};
  const copyEmail=async()=>{try{await navigator.clipboard.writeText(profile.email);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};

  return <div className={`experience ${ready?'scene-ready':''} ${failed?'scene-unavailable':''} ${reading?'reading-mode':''}`} data-active={active} ref={page}>
    <ResumeGag open={resume} onClose={()=>setResume(false)} onPrint={printSheet}/>
    <Interview open={interview} onClose={()=>setInterview(false)}/>
    <Hour/>
    <Speedrun running={speedrun} chapters={visibleChapters} navigate={navigate} onStop={()=>setSpeedrun(false)} onFinish={()=>{setSpeedrun(false);setInterview(true)}}/>
    <PrintResume/>
    <GagSheet/>
    <ProBanner on={pro} onExit={()=>setPro(false)}/>
    <a className="skip-link" href="#story" onClick={e=>{e.preventDefault();navigate('story')}}>Skip to my story</a>
    <div className="reading-progress" aria-hidden="true"><span ref={bar}/></div>
    <header className={`masthead ${active==='home'?'at-home':''}`}><button className="wordmark" onClick={()=>navigate('home')} aria-label="Back to Tushar’s world">tushar<span>.</span></button><nav className="desktop-nav" aria-label="Main navigation"><button onClick={()=>navigate('story')} className={active==='story'?'current':''}>My story</button><button onClick={()=>navigate('work')} className={active==='work'?'current':''}>What I do</button><button onClick={()=>navigate('music')} className={active==='music'?'current':''}>dhubli</button></nav><div className="header-actions"><ProToggle on={pro} onToggle={()=>setPro(v=>!v)}/><button className="hello-link" onClick={()=>navigate('contact')}>Say hello <ArrowUpRight size={15}/></button><button className="menu-button" onClick={()=>setMenu(true)} aria-label="Open all chapters"><Menu size={21}/></button></div></header>

    {!reading&&<Suspense fallback={null}><World motion={motion} build={build} onNavigate={navigate} onReady={onReady} onFail={onFail} meditating={meditating}/></Suspense>}

    <div className="stage"><div className="rail" ref={rail}><main className="journey">
      <section id="home" className="opening mood-dark" data-scene="home" style={themeVars(chapters[0].theme)}>{!reading&&<Suspense fallback={null}><LandingKoi motion={motion}/></Suspense>}<div className="opening-copy" ref={openingCopy}><h1 className="hero-name"><span className="name-line">TUSHAR</span><span className="name-line surname">GIDADHUBLI</span></h1><p className="hero-subline">Curiosity, conviction, and a little chaos. Atlanta.</p><div className="opening-links"><button onClick={()=>navigate('story')}>Read my story <ArrowRight size={15}/></button><button onClick={()=>navigate('work')}><span>Currently</span> CAO at Directive 17 <ArrowUpRight size={15}/></button><button className="resume-button" onClick={()=>setResume(true)}>Resume <ArrowUpRight size={15}/></button><button className="interview-button" onClick={()=>setInterview(true)}>Interview <ArrowUpRight size={15}/></button><button className="speedrun-button" onClick={()=>setSpeedrun(true)}>I have sixty seconds <ArrowRight size={15}/></button></div></div><div className="opening-floor"><span>{failed?'No 3D here, but every word still is.':!ready?'Warming up the water.':'Keep scrolling. It moves sideways.'}</span><button onClick={()=>navigate('story')} aria-label="Move into my story"><ArrowRight size={20}/></button></div></section>

      <SceneSection id="story" scale="lg" title="I was the kid who had to win every argument." lead="I got better. Mostly.">
        <div className="story-meta"><span>Born July 24, 2003</span><span>Northern Virginia → Atlanta</span></div>
        <AxisInvitation/>
        <div className="story-index">{fullStory.map((b,i)=><a key={b.heading} href={`#story-part-${i}`} onClick={e=>{e.preventDefault();document.getElementById(`story-part-${i}`).scrollIntoView({behavior:motion?'smooth':'instant',block:'start'})}}>{String(i+1).padStart(2,'0')}</a>)}</div>
        {fullStory.map((block,i)=><article id={`story-part-${i}`} className="story-passage" key={block.heading}><span className="passage-number">{String(i+1).padStart(2,'0')}</span><h3>{block.heading}</h3>
          <Dual
            conviction={<Unfold count={block.paragraphs.length-1}>{block.paragraphs.map((p,j)=><p key={j} className={p==='If I’m not passionate, I’m not Tushar.'?'signature-line':''}>{p}</p>)}</Unfold>}
            doubt={<Unfold label="The other reading" count={(storyCounter[i]?.length||1)-1}>{storyCounter[i]?.map((p,j)=><p key={j}>{p}</p>)}</Unfold>}
          />
        </article>)}
      </SceneSection>

      <SceneSection id="work" scale="lg" title="Eleven jobs in five years." lead="Every one of them ended because of something I decided, except the one that ended because someone stopped paying me.">
        <div className="current-role"><span className="eyebrow">Right now, in Atlanta</span><h3>Chief Administrative Officer</h3><strong>Directive 17</strong><div className="role-progression"><span>Analyst<small>February 2026</small></span><ArrowRight size={23}/><span>CAO<small>June 2026</small></span></div><p>Research, venture development, operations, investor communication, systems, and getting things across the line.</p><blockquote>“I can get shit done.”</blockquote></div>
        <div className="editorial-heading"><span className="eyebrow">What that looks like in practice</span><h3>What I actually do all day</h3></div>
        <div className="capabilities">{capabilities.map((c,i)=><article key={c.title}><span>0{i+1}</span><div><h4>{c.title}</h4><p>{c.body}</p></div></article>)}</div>
        <p className="work-evidence">Things I’ve helped create include business plans, operating models, investor decks, websites, a Master Tracker, a CEO Decision Log, and a SharePoint setup.</p>
        <Decisions/>
        <div className="editorial-heading"><span className="eyebrow">How I got here</span><h3>The path makes more sense backwards than it did forwards.</h3></div>
        <Career motion={motion}/>
        <Urbanysis/>
        <div className="skills-note"><span className="eyebrow">A reasonably honest skills section</span><h3>Advanced in every coding language</h3><p>(because I know how to properly utilize AI)</p><div className="skill-rows"><span>Really funny.</span><span>Really, really good at connecting with people.</span><span>Good at making people comfortable enough to stop performing.</span><span>Still learning. Always.</span></div></div>
      </SceneSection>

      <SceneSection id="music" scale="xl" title="dhubli" lead="Hip-hop and indie, under a name I took from my grandfather’s."><p className="etymology"><span>Gidadhubli</span> — my surname, and my grandfather’s, with four letters taken off the front.</p>
        <Dual
          conviction={<><p>My artist name comes from Gidadhubli. It’s an homage to my ancestors, with my own twist and legacy.</p><p>Hopefully they like the music.</p></>}
          doubt={<><p>I am a person who makes music rather than a musician, and I know the difference even when a bio blurs it.</p><p>Naming the project after my ancestors is a lovely gesture and also a large one to make before you have released very much.</p></>}
        />
        <BeatMachine/><MusicPlayer/></SceneSection>

      <SceneSection id="mind" scale="md" title="What was the last thing that changed your mind?" lead="Mine was a novel, which is embarrassing but true.">
        <ReadingNotes/>
        <div className="editorial-heading"><span className="eyebrow">On the timing of all this</span><h3>On being twenty-something right now</h3></div>
        <Dual
          conviction={<><p>Starting around sophomore year, I was talking about agents, companies increasingly operated by AI, a small number of key players becoming dominant, and technological progress moving much faster than regulation.</p><p>I wish I’d published those predictions at the time. My friends have heard the speeches.</p><p>What matters to me is making good use of the moment we’re in. I see people becoming sadder, lonelier, and less healthy, and I want the things I build to help improve the human condition.</p></>}
          doubt={<><p>A prediction you cannot produce is a memory, not a record. I was a college student with opinions, and so were a lot of people, and the ones who were wrong do not bring it up.</p><p>I also describe people as sadder and lonelier and less healthy as though it were established. It is what I see and believe. I have not done the work to prove it, and I should say so before I build on top of it.</p></>}
        />
        <blockquote className="big-quote">What can we do with all this that actually makes life better?</blockquote>
      </SceneSection>

      <SceneSection id="india" scale="xl" title="How I try to live." lead="I’d call myself Hindu. Probably not in the way you’re expecting.">
        <p>I read Hinduism as a philosophy and a way of living more than as a religion. I’ve read the Gita and part of the Upanishads, and what stayed with me was that every story is carrying a lesson. I pay more attention to the lessons than to the deities — and I think that’s allowed.</p>
        <p>I think it’s allowed because the openness is the point. It was built to let people arrive their own way, which is why there are so many branches of it: some vegetarian and some not, some praying to one deity and some to another, all of them still Hindu. What it asks is that you be kind, be honest, and stay aligned with who you are.</p>
        <p>So that’s what I try to do — live by the same principles every day. Spread joy. Share the love I’m holding. Make people smile. If I’m doing those three things, I don’t believe I can end up somewhere I’d be ashamed of. The hard part was never knowing the principles. It’s staying aligned with them on the days when it costs something, and being honest that the person I’m aligning to is who I think I am today, not some finished version of me.</p>
        <p>I also think people in ancient India understood things we’re still catching up to. I find it striking how often the oldest ideas about consciousness and observation rhyme with what modern physics keeps arriving at. I won’t claim one proves the other — but I don’t think we should assume we’re the first people to get anything right.</p>
        <p className="side-note">There’s more to this site than this, so I’ll stop. If you take one thing from this chapter, take that: it’s how I try to live.</p>}
        <div className="memory-card"><span className="eyebrow">The memory I keep going back to</span><h3>Beside the water</h3><p>I was young, surrounded by thousands of people at the aarti, and overwhelmed by the feeling of shared belief and community. I started crying before I had words for what I felt.</p><button className="text-link" onClick={()=>{document.getElementById('story-part-3').scrollIntoView({behavior:motion?'smooth':'instant',block:'start'})}}>Read that part of my story <ArrowUpRight size={17}/></button></div>
        <Diya/>
        <div className={`breathing-moment ${meditating?'is-breathing':''}`}><button onClick={()=>setMeditating(v=>!v)} aria-pressed={meditating}><Wind size={20}/>{meditating?'Stay here for a moment.':'Take one breath with me.'}</button><p aria-live="polite">{breathPhase||'No achievement required.'}</p><div className="breath-line" aria-hidden="true"><span/></div></div>
      </SceneSection>

      <SceneSection id="play" scale="lg" title="Dostoevsky can wait." lead="There is only so much psychological excavation a man can take before he needs to go outside."><HoopGame motion={motion}/><p className="side-note">My ideal day still ends with meeting people, talking, and dancing. Inner peace and a night out can share a calendar.</p></SceneSection>

      <SceneSection id="future" scale="lg" title="Two endings, both plausible."><div className="future-option"><span>One</span><h3>U.S. ambassador to India</h3><p>A long-standing ambition, connected to the country I love and the international affairs I chose to study.</p></div><div className="future-option"><span>Two</span><h3>Books, a beach, and a very early retirement</h3><p>Kind of like Thanos. The retirement part. I feel I should specify.</p></div><blockquote className="big-quote">Whatever the ending, I hope my greatest contribution is the joy I spread.</blockquote></SceneSection>

      <SceneSection id="contact" scale="sm" title="Say hi." lead="You don’t need a professional reason."><div className="closer"><h3>{closing.head}</h3><p>{closing.body}</p></div>{profile.email&&<div className="contact-email"><a href={`mailto:${profile.email}`}><Mail size={19}/>{profile.email}<ArrowUpRight size={18}/></a><button className="icon-button" onClick={copyEmail} aria-label="Copy email address">{copied?<Check size={18}/>:<Copy size={18}/>}</button></div>}<div className="contact-links">{profile.instagram&&<a href={profile.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight/></a>}{profile.linkedin&&<a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight/></a>}<a href={profile.spotify} target="_blank" rel="noreferrer">Find my music <ArrowUpRight/></a></div><div className="closing-signature">If I’m not passionate,<br/>I’m not Tushar.</div><button className="text-link" onClick={()=>navigate('home')}>Back to the beginning <ArrowUpRight size={17}/></button><footer className="endnote"><span>Tushar Gidadhubli</span><span>Made with curiosity. And a little help from AI.</span></footer></SceneSection>
    </main></div></div>
    <div className="runway" ref={runway} aria-hidden="true"/>

    <div className="world-controls">
      <button className="chapter-control" onClick={()=>setMenu(true)}>{chapters.find(c=>c.id===active).label}<Compass size={15}/></button>
      <div className="control-actions">
        <AxisControl compact/>
        <button onClick={wander} className="icon-button" aria-label="Surprise me with another chapter"><Shuffle size={16}/></button>
        <button onClick={()=>setBuild(b=>!b)} className={`icon-button build-toggle ${build?'is-on':''}`} aria-pressed={build} aria-label="Show how the objects are built"><Boxes size={16}/></button>
        <button onClick={()=>setMotion(!motion)} className="motion-control" aria-pressed={motion}>{motion?<Pause size={13}/>:<Play size={13}/>}<span>{motion?'Motion on':'Bring it to life'}</span></button>
        <button className="reading-control" onClick={()=>setReading(!reading)} aria-pressed={reading}>{reading?'Return to the world':'Just the words'}</button>
      </div>
    </div>

    {menu&&<div className="menu-scrim" onClick={()=>setMenu(false)}><div className="explore-menu" ref={dialog} role="dialog" aria-modal="true" aria-label="Explore all chapters" onClick={e=>e.stopPropagation()}><div className="menu-top"><span className="eyebrow">Wherever you like</span><button className="icon-button" aria-label="Close navigation" onClick={()=>setMenu(false)}><X/></button></div><h2>Nine ways in</h2><nav>{visibleChapters.map(c=><button key={c.id} onClick={()=>navigate(c.id)}><strong>{c.label}</strong>{visited.includes(c.id)?<Check size={17}/>:<ArrowUpRight size={18}/>}</button>)}</nav><div className="menu-axis"><span className="eyebrow">Reading as</span><strong>{side==='doubt'?'The case against me':'How I tell it'}</strong><AxisControl/></div><button className="text-link" onClick={wander}>Surprise me <Shuffle size={15}/></button></div></div>}
  </div>
}
