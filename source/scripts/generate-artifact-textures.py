from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public'/'artifacts';out.mkdir(exist_ok=True)
fontdir=Path('/usr/share/fonts/truetype')
fonts=list(fontdir.rglob('*.ttf'))
def font(size,serif=False,bold=False):
 terms=['DejaVuSerif' if serif else 'DejaVuSans', '-Bold' if bold else '.ttf']
 p=next((x for x in fonts if all(t in x.name for t in terms)),fonts[0])
 return ImageFont.truetype(str(p),size)
rng=np.random.default_rng(24)
# Original label typography, prepared as texture assets rather than browser drawings.
im=Image.new('RGB',(1536,410),'#ede4d4');d=ImageDraw.Draw(im)
d.rounded_rectangle((12,12,1523,397),radius=24,outline='#8a6b98',width=3)
d.text((70,12),'dhubli',font=font(170,True),fill='#40215e')
d.text((80,256),'HIP-HOP  /  INDIE',font=font(37),fill='#624777')
d.text((1060,45),'SIDE A',font=font(40,False,True),fill='#624777')
d.text((1175,126),'01',font=font(120,True),fill='#765287')
d.line((80,240,950,240),fill='#b59b70',width=3)
d.text((80,330),'GIDADHUBLI  /  A LITTLE LEGACY',font=font(21),fill='#746371')
im.save(out/'cassette-label.jpg',quality=93)
for side in ['left','right']:
 im=Image.new('RGB',(768,1100),'#f0e6d2');a=np.asarray(im).copy().astype(float);noise=rng.normal(0,.75,(1100,768,1));a=np.clip(a+noise,0,255).astype('uint8');im=Image.fromarray(a);d=ImageDraw.Draw(im)
 d.line((92,77,675,77),fill='#b8a987',width=1)
 d.text((300,42),'NOTES TO SELF',font=font(15),fill='#86745a')
 if side=='left':
  d.text((100,210),'What if',font=font(79,True),fill='#3e2a36');d.text((100,310),'I’m wrong?',font=font(79,True),fill='#3e2a36')
  lines=['Leave a little room for the unexpected.','A book. A person. A conversation.','An idea you did not know you needed.','','You do not have to be the same person','who opened these pages.']
  y=540
 else:
  d.text((100,166),'Timshel.',font=font(83,True),fill='#3e2a36')
  lines=['Being a good person is a choice','you make every day.','','Especially when it is hard.','','Inconvenient that you have to keep','doing it. Fair enough, though.']
  y=380
 for line in lines:
  d.text((100,y),line,font=font(23,True),fill='#6c5c4b');y+=43
 d.line((95,978,672,978),fill='#b8a987',width=1);d.text((365,1004),'24' if side=='left' else '25',font=font(20,True),fill='#897554')
 im.save(out/f'page-{side}.jpg',quality=94)
# Leather: uneven, closely spaced pebbles with a normal map.
n=1024;y,x=np.mgrid[:n,:n];h=np.zeros((n,n),dtype=float)
for j in range(-1,90):
 for i in range(-1,90):
  cx=i*12+(j%2)*6+rng.uniform(-2,2);cy=j*12+rng.uniform(-2,2);r=rng.uniform(3.4,5)
  x0=max(0,int(cx-r-2));x1=min(n,int(cx+r+3));y0=max(0,int(cy-r-2));y1=min(n,int(cy+r+3))
  if x1>x0 and y1>y0:
   yy,xx=np.mgrid[y0:y1,x0:x1];v=np.maximum(0,1-((xx-cx)**2+(yy-cy)**2)/r**2)**.7
   h[y0:y1,x0:x1]=np.maximum(h[y0:y1,x0:x1],v)
h=np.asarray(Image.fromarray((h*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.5)))/255
base=np.array([164,76,28]);var=(h*.15+rng.normal(0,.018,(n,n)))[...,None]
col=np.clip(base*(.91+var),0,255).astype('uint8');Image.fromarray(col).save(out/'leather-color.jpg',quality=92)
gy,gx=np.gradient(h);normal=np.dstack([-gx*1.7,-gy*1.7,np.ones_like(h)]);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
Image.fromarray(((normal*.5+.5)*255).astype('uint8')).save(out/'leather-normal.jpg',quality=95)
# Fine stone grain and bookcloth height maps.
noise=rng.normal(127,13,(512,512));Image.fromarray(np.clip(noise,0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(.4)).save(out/'stone-grain.jpg',quality=88)
a=(np.sin(np.arange(512)[None,:]*2.3)+np.sin(np.arange(512)[:,None]*2.3))*18+128+rng.normal(0,6,(512,512));Image.fromarray(np.clip(a,0,255).astype('uint8')).save(out/'cloth-grain.jpg',quality=88)
print('Created',len(list(out.iterdir())),'original material textures.')
