import json, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
G='/home/claude/game'; A=f'{G}/assets'; os.makedirs(A,exist_ok=True)
M=json.load(open('frames/meta.json'))
# ---------- scales (atlas px per source px); atlas renders at 2x world units ----------
SC={
 ('player','*'):0.66,
 ('chef','*'):0.86,('chef','idle'):1.17,('chef','walk'):1.35,('chef','prepare'):0.65,('chef','wash'):0.65,
 ('player','walk'):1.2,('player','carry_tray'):1.2,('player','carry_plates'):1.2,('player','sleep'):1.2,
 ('waitress','*'):1.03,('cashier','*'):1.05,('cleaner','*'):1.05,
 ('cust_orange','*'):1.15,('cust_gray','*'):1.2,
 ('vip1','walk'):1.65,('vip1','sit'):1.6,('vip1','drink'):1.6,('vip1','sit_cat'):1.3,('vip1','drink_cat'):1.3,('vip1','idle'):0.95,
 ('manager','*'):0.5,
 ('vip2','idle'):0.86,('vip2','walk'):1.25,('vip2','sit'):1.18,('vip2','drink'):1.18,('vip2','sit_cat'):1.18,('vip2','drink_cat'):1.18,
}
def sc(ch,an): return SC.get((ch,an),SC.get((ch,'*')))

def legs_walk(img,ax,ay,lift=4):
    """Synthesize 4-frame walk: only legs strip animates (alternating lift), head/torso fixed."""
    a=np.array(img); al=a[...,3]>0
    ys,xs=np.nonzero(al); top,bot=ys.min(),ys.max()
    h=bot-top; leg0=int(bot-h*0.17)
    frames=[]
    for f in range(4):
        b=a.copy()
        if f in (1,3):
            side = (xs.min()+xs.max())//2
            strip=a[leg0:bot+1].copy()
            m=np.zeros(strip.shape[:2],bool)
            if f==1: m[:, :side]=True
            else: m[:, side:]=True
            # clear the moving leg region in target then paste lifted
            region=b[leg0:bot+1]
            src=strip.copy(); src[~m]=0
            region[m]=0
            # base stays: torso pixels above leg0 untouched; paste lifted leg overlapping
            for yy in range(src.shape[0]):
                ty=leg0+yy-lift
                row=src[yy]; mk=row[...,3]>0
                b[ty][mk]=row[mk]
        frames.append(Image.fromarray(b))
    return frames

def tail_wiggle(img):
    return img

class Packer:
    def __init__(s,W=2048): s.W=W; s.x=0; s.y=0; s.rowh=0; s.items=[]
    def add(s,key,im):
        w,h=im.size
        if s.x+w+2>s.W: s.x=0; s.y+=s.rowh+2; s.rowh=0
        s.items.append((key,im,s.x,s.y)); s.x+=w+2; s.rowh=max(s.rowh,h)
    def save(s,name):
        if name=='props':   # shelf-pack tallest first so the bigger (super-resolved) icons still fit the 2048x2048 page
            items=sorted(s.items,key=lambda t:-t[1].height); s.items=[]; s.x=s.y=s.rowh=0
            for key,im,_,_ in items: s.add(key,im)
        H=s.y+s.rowh+2
        H=int(2**np.ceil(np.log2(max(H,64))))
        at=Image.new('RGBA',(s.W,H),(0,0,0,0)); fr={}
        for key,im,x,y in s.items: at.paste(im,(x,y)); fr[key]=[x,y,im.width,im.height]
        at.save(f'{A}/{name}.webp',lossless=False,quality=88,method=6,alpha_quality=95)
        return fr,(s.W,H)

manifest={'atlases':{},'chars':{},'props':{}}
DIRS=['front','front_right','right','back_right','back','back_left','left','front_left']

def clean_top(im):
    a=np.array(im); m=a[...,3]>40
    if m.sum()<50: return im
    ys,xs=np.nonzero(m); t0,t1=ys.min(),ys.max(); band=int(t0+(t1-t0)*0.28)
    core=ndi.binary_dilation(ndi.binary_opening(m,iterations=3),iterations=4)
    rm=m.copy(); rm[band:]=False; rm&=~core
    a[...,3][rm]=0
    m2=a[...,3]>40; lab,n=ndi.label(m2)
    if n>1:
        sz=ndi.sum(m2,lab,range(1,n+1)); keep=np.zeros(n+1,bool); keep[1:]=sz>=0.03*sz.max(); a[...,3][~keep[lab]]=0
    return Image.fromarray(a)

def scaled(path,s):
    im=clean_top(Image.open(path).convert('RGBA'))
    w,h=max(1,round(im.width*s)),max(1,round(im.height*s))
    return im.resize((w,h),Image.LANCZOS)

def add_char(pk,ch,anims_out,an,dirs,s,src_anim=None):
    anims_out[an]={}
    for d,lst in dirs.items():
        anims_out[an][d]=[]
        for i,f in enumerate(lst):
            if isinstance(f,dict):
                im=scaled(f"frames/{ch}/{src_anim or an}/{f['f']}",s); ax,ay=f['ax']*s,f['ay']*s
            else:
                im,ax,ay=f
            key=f'{ch}.{an}.{d}.{i}'; pk.add(key,im)
            anims_out[an][d].append([key,round(ax,1),round(ay,1)])

SUB={('cust_orange','idle'):[0,2,3,4],('cust_orange','walk'):[0,2,4,6],('cust_orange','sit'):[0,2,4,6],('cust_orange','eat'):[1,2,3,4],('cust_orange','happy'):[0,2,4,6],('cust_gray','eat'):[1,2,3,4],('cust_gray','drink'):[1,2,3,4],('cust_gray','walk'):[0,2,4,6]}
SKIP={('chef','rest_unused'),('waitress','walk'),('cust_orange','angry'),('waitress','sleep'),('cashier','rest'),('cleaner','sleep'),('cleaner','collect'),('player','idle')}
for ch in M:
    if ch in ('cust_calico',): continue
    pk=Packer(); out={}
    for an,dirs in M[ch].items():
        if (ch,an) in SKIP: continue
        sub=SUB.get((ch,an))
        if sub: dirs={d:[l[i] for i in sub if i<len(l)] for d,l in dirs.items()}
        add_char(pk,ch,out,an,dirs,sc(ch,an))
    # synthesized walks (legs-only) where clean walk sheets don't exist
    synth={'player':'idle','manager':'idle','vip1':None}
    if ch=='chef_synth_walk_disabled':
        s=sc(ch,'idle'); dd={}
        for d,lst in M[ch]['idle'].items():
            f=lst[0]; im=scaled(f"frames/{ch}/idle/{f['f']}",s)
            fr=legs_walk(im,f['ax']*s,f['ay']*s,lift=5)
            dd[d]=[(x,f['ax']*s,f['ay']*s) for x in fr]
        add_char(pk,ch,out,'walk',dd,s)
    if ch=='waitress':
        s=sc(ch,'idle'); dd={}
        for d,lst in M[ch]['idle'].items():
            f=lst[0]; im=scaled(f"frames/{ch}/idle/{f['f']}",s)
            fr=legs_walk(im,f['ax']*s,f['ay']*s,lift=5)
            dd[d]=[(x,f['ax']*s,f['ay']*s) for x in fr]
        add_char(pk,ch,out,'walk',dd,s)
    if ch=='manager':
        s=sc(ch,'idle'); dd={}
        for d,lst in M[ch]['idle'].items():
            f=lst[0]; im=scaled(f"frames/{ch}/idle/{f['f']}",s)
            fr=legs_walk(im,f['ax']*s,f['ay']*s,lift=5)
            dd[d]=[(x,f['ax']*s,f['ay']*s) for x in fr]
        add_char(pk,ch,out,'walk',dd,s)
    RN={'player':'waiter','waitress':'server'}; cn=RN.get(ch,ch)
    fr,size=pk.save(f'char_{cn}')
    manifest['atlases'][f'char_{cn}']={'file':f'assets/char_{cn}.webp','frames':fr,'size':size}
    manifest['chars'][cn]={'atlas':f'char_{cn}','anims':out}
    print(ch,size)

# ---------- props ----------
pk=Packer()
ENV={'floor_wood':22,'floor_tile':23,'floor_tatami':20,'floor_rug':21,'floor_stone':19,'wall':0,
 'st_salmon':38,'st_tuna':43,'st_rice':39,'st_storage':56,'st_premium':58,'st_dessert':36,'st_maki':59,'st_sink':57,'st_drink':71,
 'cashier':46,'mgr_desk':37,'chair_red':7,'chair_red2':5,'stool':24,'stool2':25,'stool_round':14,'table_round':4,'table_sq':8,'table_long':18,
 'armchair':86,'armchair2':99,'armchair3':100,'sofa':85,'sofa2':82,'sofa3':102,'sofa4':103,'bench_red':6,
 'lantern_w':88,'lantern_p':89,'lantern_r':90,'lantern_r2':139,'banner':80,'banner2':135,'banner3':143,
 'plant1':79,'plant2':91,'bamboo':94,'bonsai':95,'sakura_pot':96,'plant3':98,'plant4':116,'plant5':123,'plant6':128,'plant7':140,'flower':134,
 'sakura_tree':78,'gate':84,'stall':83,'koi':114,'maneki':129,'chalkboard':126,'screen':76,'shoji':87,'shoji2':101,'shoji3':115,'fence':104,'planter':106,'cushion':144,'stones':107,'gold':142,
 'f_salmon':29,'f_tuna':30,'f_tamago':31,'f_shrimp':45,'f_ikura':50,'f_maki':52,'f_maki2':27,'f_premium':26,'f_dragon':54,
 'd_matcha':66,'d_cake':67,'d_mochi':68,'d_pudding':69,'dr_boba':62,'dr_matcha':63,'dr_wine':64,'cart':47,'cart2':61}
PS={'wall':0.5}   # props kept at full source resolution (v3: sharper on 3x phones)
# small food / drink / item icons are drawn much larger than their source in bubbles, cards and the UI on 3x phones:
# super-resolve them (EDSR x4, tools/icon_sr.py) down to 2x the source size. Results are cached in sr_cache/.
def sr_icon(path):
    os.makedirs('sr_cache',exist_ok=True); cp_=f"sr_cache/{path.replace('/','_')}"
    if not os.path.exists(cp_) or os.path.getmtime(cp_)<os.path.getmtime(path):
        import subprocess, sys
        subprocess.run([sys.executable,'icon_sr.py','--one',path,cp_],check=True,env={**os.environ,'PYTHONPATH':os.environ.get('SR_CV4','/tmp/claude-0/-home-claude/765e8b27-24a2-5c8f-bc7f-fe3327a73871/scratchpad/cv4')})
    return clean_top(Image.open(cp_).convert('RGBA'))
SR_ENV={'stool','bench_red','table_sq','armchair','armchair2','floor_tatami','st_rice','st_storage','st_premium','st_maki','cashier','mgr_desk'}   # shop / card icons that are also small in the source
for k,i in ENV.items():
    s=PS.get(k,1.0 if not k.startswith(('f_','d_','dr_')) else 0.8)
    if k.startswith('floor'): s=0.5
    im=sr_icon(f'env/{i}.png') if k.startswith(('f_','d_','dr_')) or k in SR_ENV else scaled(f'env/{i}.png',s); pk.add(k,im)
for k in os.listdir('cp'):
    n=k[:-4]
    if n in ('plate_white',): continue
    big=n.startswith(('box','tray','lantern','chalk','noren'))
    im=sr_icon(f'cp/{k}') if (not big or n.startswith(('box','tray'))) else scaled(f'cp/{k}',1.0); pk.add('c_'+n,im)
for k in sorted(os.listdir('stations')):            # new salmon/tuna prep stations (4 states) + chef-at-station overlays
    if k.startswith(('st4_','st5_','vip_sofa','vip_table')):   # small sources (Nori-Maki / Ikura counters, VIP sofa + table): super-resolve to 2x so they stay sharp
        pk.add(k[:-4],sr_icon(f'stations/{k}')); continue
    pk.add(k[:-4],scaled(f'stations/{k}',(0.75 if k.startswith('dine_one') else 1.0) if k.startswith('dine_') and not k.startswith('dine_table') else (0.6 if k.startswith('dine_table') else 0.42)))   # dining sprites are small in the source: keep them sharp
for k in sorted(os.listdir('stations_hd')):   # already built at 2x from super-resolved parts (st5 drink/dessert counters)
    pk.add(k[:-4],clean_top(Image.open(f'stations_hd/{k}').convert('RGBA')))
fr,size=pk.save('props')
manifest['atlases']['props']={'file':'assets/props.webp','frames':fr,'size':size}
os.makedirs(f'{G}/js',exist_ok=True)
open(f'{G}/js/manifest.js','w').write('/* generated by tools/build_assets.py */\nwindow.CST=window.CST||{};CST.MANIFEST='+json.dumps(manifest,separators=(',',':'))+';\n')
print('props',size)
