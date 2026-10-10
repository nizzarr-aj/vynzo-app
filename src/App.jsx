import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { Eye, Gift, Wallet, Clock3, LogOut, PlayCircle, Glasses, RefreshCw, Heart, MessageCircle, Share2, Volume2 } from 'lucide-react';

const slots = ['06:00', '12:00', '18:00', '23:00'];

const demoVideos = [
  {
    id: 'demo-flower',
    title: 'تجربة عرض الفيديو العمودي',
    description: 'هذا فيديو تجريبي باش تشوف شكل موجز VYNZO. موش محتوى منشور من مستخدم.',
    video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail_url: '',
    username: 'vynzo_demo',
    display_name: 'VYNZO Demo',
    likes_count: 0,
    comments_count: 0,
    is_demo: true
  },
  {
    id: 'demo-escape',
    title: 'تجربة ثانية للموجز',
    description: 'الفيديوهات هاذم مؤقتين للعرض فقط، وما يتحسبوش وقت مشاهدة للمكافآت.',
    video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: '',
    username: 'vynzo_demo',
    display_name: 'VYNZO Demo',
    likes_count: 0,
    comments_count: 0,
    is_demo: true
  }
];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [wallet, setWallet] = useState(null);
  const [box, setBox] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [language, setLanguage] = useState(() => localStorage.getItem('vynzo-language') || 'ar');
  const isFr = language === 'fr';
  const tx = (ar, fr) => isFr ? fr : ar;
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [likedVideos, setLikedVideos] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadDashboard();
  }, [session]);

  useEffect(() => {
    if (session && currentTab === 'videos') loadVideos();
  }, [session, currentTab]);

  async function loadVideos() {
    if (!supabase) return;
    setLoadingVideos(true);
    const { data, error } = await supabase.from('vynzo_video_feed')
      .select('id,title,description,video_url,thumbnail_url,duration_seconds,username,display_name,likes_count,comments_count,published_at')
      .order('published_at', { ascending: false }).limit(20);
    if (error) setMessage(tx('ما نجّمناش نحمّلوا الفيديوهات. تثبّت من صلاحيات قاعدة البيانات.','Could not load videos. Check the database permissions.'));
    else setVideos(data || []);
    setLoadingVideos(false);
  }

  async function loadDashboard() {
    if (!supabase || !session) return;
    setRefreshing(true);
    const [walletResult, boxResult] = await Promise.all([
      supabase.rpc('vynzo_wallet_summary'),
      supabase.rpc('vynzo_golden_box_status')
    ]);
    if (!walletResult.error && walletResult.data) setWallet(Array.isArray(walletResult.data) ? walletResult.data[0] : walletResult.data);
    if (!boxResult.error && boxResult.data) setBox(Array.isArray(boxResult.data) ? boxResult.data[0] : boxResult.data);
    const errors = [walletResult.error, boxResult.error].filter(Boolean);
    if (errors.length) setMessage('تعذّر تحديث بعض المعلومات. تأكّد من إعدادات قاعدة البيانات.');
    setRefreshing(false);
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const result = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (isSignup && !result.data.session) setMessage('Check your email to confirm your account.');
    else setMessage('');
    setBusy(false);
  }

  async function claimBox() {
    if (!supabase || !box?.box_id) return;
    setBusy(true); setMessage('');
    const { error } = await supabase.rpc('vynzo_claim_reward_box', { p_box_id: box.box_id });
    setMessage(error ? 'Could not claim the reward. Please try again.' : 'Reward points have been added to your wallet.');
    await loadDashboard();
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setWallet(null); setBox(null);
  }

  if (!supabaseConfigured) {
    return <main className="setup-page"><div className="setup-card">
      <div className="brand-mark">V</div><p className="eyebrow">SHORT VIDEO • REWARDS</p>
      <h1>أهلا بيك في <span>VYNZO</span></h1>
      <p>الواجهة الأوّلية جاهزة. يلزم إعداد مفاتيح Supabase باش نربطوها بقاعدة البيانات.</p>
      <div className="setup-steps"><b>الخطوة الجاية</b><ol><li>انسخ ملف <code>.env.example</code> وسمّيه <code>.env</code>.</li><li>حطّ رابط مشروع VYNZO ومفتاح الـ publishable متاع Supabase.</li><li>شغّل التطبيق من بيئة التطوير.</li></ol></div>
      <small>ما تحطّش مفتاح service_role في واجهة التطبيق.</small>
    </div></main>;
  }

  if (!session) return <main className="setup-page"><form className="auth-card" onSubmit={handleAuth}>
    <div className="brand-mark">V</div><p className="eyebrow">SHORT VIDEO • REWARDS</p>
    <h1>{isSignup ? tx('إنشاء حساب','Create account') : tx('مرحبا برجوعك','Welcome back')}</h1><p className="muted">{tx('ادخل لـ VYNZO وتابع رصيدك ووقت المشاهدة.','Sign in to VYNZO to track your balance and watch time.')}</p>
    <label>{tx('البريد الإلكتروني','Email address')}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label>
    <label>{tx('كلمة السر','Password')}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={isSignup?'new-password':'current-password'} /></label>
    {message && <p className="notice">{message}</p>}
    <button className="primary-btn" disabled={busy}>{busy ? tx('لحظة...','Please wait…') : isSignup ? tx('إنشاء حساب','Create account') : tx('دخول','Sign in')}</button>
    <button type="button" className="text-btn" onClick={()=>{setIsSignup(!isSignup);setMessage('');}}>{isSignup ? tx('عندك حساب؟ ادخل','Already have an account? Sign in') : tx('ما عندكش حساب؟ سجّل توّا','New here? Create an account')}</button>
  </form></main>;

  const points = Number(wallet?.points_balance ?? 0);
  const value = Number(wallet?.estimated_value_usd ?? 0);
  const used = Number(box?.watch_seconds_used ?? 0);
  const required = Number(box?.watch_seconds_required ?? 2400);
  const progress = Math.min(100, Math.round((used / Math.max(required, 1)) * 100));

  return <main className={`app-shell ${isFr ? 'lang-fr' : 'lang-ar'}`} dir={isFr ? 'ltr' : 'rtl'}>
    <header className="topbar"><div className="brand"><div className="brand-mark small">V</div><div><b>VYNZO</b><small>{tx('شاهد. اكتشف. تقدّم.','Watch. Discover. Rise.')}</small></div></div><div className="topbar-tools"><button className="language-toggle" onClick={()=>{const next= isFr ? 'ar':'fr';setLanguage(next);localStorage.setItem('vynzo-language',next);}} aria-label="Change language">{isFr ? 'عربي' : 'FR'}</button><button className="icon-btn" onClick={signOut} title={tx('خروج','Sign out')}><LogOut size={18}/></button></div></header>
    {currentTab === 'videos' ? <section className="tiktok-feed">
      <div className="feed-topbar"><button className="feed-refresh" onClick={loadVideos} disabled={loadingVideos} aria-label={tx('تحديث الفيديوهات','Refresh videos')}><RefreshCw size={18}/></button><div><span>{tx('متابَعون','Following')}</span><b>{tx('لك','For You')}</b><i/></div></div>
      {loadingVideos ? <div className="feed-empty"><RefreshCw size={30}/><b>قاعدين نحمّلوا الفيديوهات…</b></div> : <><div className="demo-notice">{videos.length === 0 ? tx('وضع تجريبي · الفيديوهات هاذم للعرض فقط','DEMO MODE · Sample videos for preview only') : ''}</div><div className="tiktok-scroll">{(videos.length ? videos : demoVideos).map((video,index) => <article className="tiktok-video" key={video.id}>
        {video.video_url && /^https?:\/\//i.test(video.video_url) ? <video className="tiktok-player" controls playsInline preload="metadata" poster={video.thumbnail_url || undefined} src={video.video_url}/> : <div className="tiktok-placeholder"><PlayCircle size={48}/><b>{tx('الفيديو غير جاهز للتشغيل','Video unavailable')}</b><span>{tx('يلزم رابط فيديو صالح','A valid video URL is required')}</span></div>}
        <div className="video-shade"/>
        <div className="tiktok-caption"><b>@{video.username || video.display_name || 'vynzo_creator'}</b><p>{video.title}</p>{video.description && <p>{video.description}</p>}<span className="sound-label"><Volume2 size={14}/> {video.is_demo ? tx('فيديو تجريبي · VYNZO','Demo video · VYNZO') : tx('الصوت الأصلي · VYNZO','Original sound · VYNZO')}</span></div>
        <div className="tiktok-actions"><div className="creator-avatar">{(video.display_name || video.username || 'V').slice(0,1).toUpperCase()}</div><button aria-label={tx('إعجاب','Like')} className={likedVideos.includes(video.id)?'feed-action liked':'feed-action'} onClick={()=>setLikedVideos(prev=>prev.includes(video.id)?prev.filter(id=>id!==video.id):[...prev,video.id])}><Heart size={29} fill={likedVideos.includes(video.id)?'currentColor':'none'}/><small>{Number(video.likes_count||0)+(likedVideos.includes(video.id)?1:0)}</small></button><div className="feed-action"><MessageCircle size={28}/><small>{video.comments_count||0}</small></div><button aria-label={tx('مشاركة','Share')} className="feed-action" onClick={()=>{if(navigator.share) navigator.share({title:video.title||'VYNZO',text:video.description||'',url:window.location.href}).catch(()=>{});else setMessage(tx('استعمل زر مشاركة المتصفّح باش تبعث رابط VYNZO.','Use your browser share button to share VYNZO.'))}}><Share2 size={27}/><small>{tx('مشاركة','Share')}</small></button></div>
      </article>)}</div></>}
    </section>: currentTab === 'rewards' ? <section className="feed-page"><div className="section-heading"><div><span className="mini-label">{tx('مكافآت VYNZO','VYNZO REWARDS')}</span><h2>{tx('الصندوق الذهبي','Golden reward')}</h2></div><div className="gift-orb"><Gift size={23}/></div></div><div className="panel"><p className="muted">{tx('يلزمك 40 دقيقة مشاهدة مسجّلة في النهار باش تتحقّق من الأهلية.','You need 40 minutes of recorded viewing per day to qualify.')}</p><div className="progress-meta"><b>{isFr ? `${Math.floor(used/60)} / 40 min` : `${Math.floor(used/60)} / 40 دقيقة`}</b><span>{progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:progress+'%'}}/></div><div className="box-status">{box?.box_status === 'claimed' ? tx('الصندوق متاع اليوم خذيتو بالفعل.','Today’s reward has already been claimed.') : box?.eligible_to_open ? tx('الصندوق متاح ليك اليوم.','Your reward is available today.') : tx('مازلت ما كملتش وقت المشاهدة المطلوب.','You have not completed the required watch time yet.')}</div><button className="primary-btn" disabled={busy || !box?.eligible_to_open || !box?.box_id || box?.box_status === 'claimed'} onClick={claimBox}><Gift size={17}/>{busy ? 'لحظة...' : box?.box_status === 'claimed' ? 'Claimed' : 'Claim reward · 50 points'}</button><small className="disclaimer">{tx('النقاط موش أرباح نقدية مضمونة، والسحب معطّل حاليًا.','Points are not guaranteed cash earnings. Withdrawals are currently disabled.')}</small></div></section> : currentTab === 'wallet' ? <section className="feed-page"><div className="section-heading"><div><span className="mini-label">{tx('رصيدك','YOUR BALANCE')}</span><h2>{tx('المحفظة','Wallet')}</h2></div><div className="gift-orb"><Wallet size={23}/></div></div><div className="panel"><span className="mini-label">{tx('رصيد النقاط','Points balance')}</span><h1>{points.toLocaleString('en-US')} <small>{tx('نقطة','points')}</small></h1><p className="muted">{tx('القيمة التقديرية: ','Estimated value: ')}${value.toFixed(2)}{tx(' حسب إعدادات التطبيق الحالية.',' based on current app settings.')}</p><div className="box-status">{tx('السحب والتحويل معطّلان حاليًا. ما فماش مدفوعات فعلية في النسخة هاذي.','Withdrawals and transfers are currently disabled. No real payments are available in this preview.')}</div></div></section> : <>
    <section className="welcome"><div><p className="eyebrow">{tx('مرحبا بيك','WELCOME BACK')}</p><h1>{tx('نهارك زين، ','Your next') } <span>{tx('واصل تقدّمك!','level starts now.')}</span></h1><p>{tx('كل دقيقة مشاهدة تتسجّل حسب نظام التطبيق.','Track your viewing progress and daily rewards in one place.')}</p></div><div className="welcome-icon"><Glasses size={36}/></div></section>
    {message && <div className="notice">{message}</div>}
    <section className="stats-grid">
      <article className="stat-card"><div className="stat-icon"><Wallet size={19}/></div><span>{tx('رصيد النقاط','Points balance')}</span><strong>{points.toLocaleString('en-US')}</strong><small>{tx('نقطة','points')}</small></article>
      <article className="stat-card"><div className="stat-icon purple"><Gift size={19}/></div><span>{tx('القيمة التقديرية','Estimated value')}</span><strong>${value.toFixed(2)}</strong><small>{tx('موش مبلغ قابل للسحب توّا','Not withdrawable')}</small></article>
    </section>
    <section className="panel watch-panel"><div className="section-heading"><div><span className="mini-label">{tx('وقت المشاهدة','WATCH TIME')}</span><h2>{tx('حصّتك اليومية','Your daily goal')}</h2></div><button className="icon-btn" onClick={loadDashboard} disabled={refreshing}>{refreshing ? '…' : <RefreshCw size={17}/>}</button></div>
      <div className="progress-meta"><b>{isFr ? `${Math.floor(used/60)} / 40 min` : `${Math.floor(used/60)} / 40 دقيقة`}</b><span>{progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:progress+'%'}}/></div>
      <div className="slot-grid">{slots.map((time,i)=><div className="slot" key={time}><Clock3 size={16}/><b>{time}</b><small>{tx(`الحصّة ${i+1}`,`Session ${i+1}`)}</small></div>)}</div>
      <p className="hint">{tx('تتحلّ 10 دقايق في كل حصّة. أقصى وقت في النهار 40 دقيقة، والوقت غير المستعمل ما يتنقلش لنهار آخر.','Each session allows 10 minutes. The daily limit is 40 minutes; unused time does not roll over.')}</p>
    </section>
    <section className="panel reward-panel"><div className="section-heading"><div><span className="mini-label">{tx('مكافأة يومية','DAILY REWARD')}</span><h2>{tx('الصندوق الذهبي','Golden reward')}</h2></div><div className="gift-orb"><Gift size={23}/></div></div>
      <p className="muted">{tx('كمّل 40 دقيقة مشاهدة مسجّلة باش تتحقّق من إمكانية الحصول على الصندوق اليومي.','Complete 40 minutes of recorded viewing to check eligibility for the daily reward.')}</p>
      <div className="box-status">{box?.box_status === 'claimed' ? tx('الصندوق متاع اليوم خذيتو بالفعل.','Today’s reward has already been claimed.') : box?.eligible_to_open ? tx('مبروك! الصندوق متاح ليك.','Great! Your reward is ready.') : tx('كمّل وقت المشاهدة المطلوب باش تتحقّق الأهلية.','Complete the required watch time to check eligibility.')}</div>
      <button className="primary-btn" disabled={busy || !box?.eligible_to_open || !box?.box_id || box?.box_status === 'claimed'} onClick={claimBox}><Gift size={17}/>{busy ? tx('لحظة...','Please wait…') : box?.box_status === 'claimed' ? tx('تمّ الاستلام','Claimed') : tx('استلام الصندوق · 50 نقطة','Claim reward · 50 points')}</button>
      <small className="disclaimer">Points and displayed values are estimates. Transfers and withdrawals are currently disabled; cash earnings are not guaranteed.</small>
    </section>
    </>}
    <nav className="bottom-nav"><button className={'nav-item '+(currentTab==='home'?'active':'')} onClick={()=>setCurrentTab('home')}><PlayCircle size={20}/><span>{tx('الرئيسية','Home')}</span></button><button className={'nav-item '+(currentTab==='videos'?'active':'')} onClick={()=>setCurrentTab('videos')}><Eye size={20}/><span>{tx('الفيديوهات','Videos')}</span></button><button className={'nav-item '+(currentTab==='rewards'?'active':'')} onClick={()=>setCurrentTab('rewards')}><Gift size={20}/><span>{tx('المكافآت','Rewards')}</span></button><button className={'nav-item '+(currentTab==='wallet'?'active':'')} onClick={()=>setCurrentTab('wallet')}><Wallet size={20}/><span>{tx('المحفظة','Wallet')}</span></button></nav>
    <footer>VYNZO • {tx('نسخة تجريبية أوّلية','Early access preview')}</footer>
  </main>;
}
