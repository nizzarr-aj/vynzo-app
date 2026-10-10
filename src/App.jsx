import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { Eye, Gift, Wallet, Clock3, LogOut, PlayCircle, Glasses, RefreshCw } from 'lucide-react';

const slots = ['06:00', '12:00', '18:00', '23:00'];

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

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadDashboard();
  }, [session]);

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
    else if (isSignup && !result.data.session) setMessage('تفقد بريدك الإلكتروني لتأكيد الحساب.');
    else setMessage('');
    setBusy(false);
  }

  async function claimBox() {
    if (!supabase || !box?.box_id) return;
    setBusy(true); setMessage('');
    const { error } = await supabase.rpc('vynzo_claim_reward_box', { p_box_id: box.box_id });
    setMessage(error ? 'ما نجّمش ناخذوا الصندوق توّا. عاود جرّب.' : 'تمّت إضافة نقاط الصندوق لمحفظتك.');
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
    <h1>{isSignup ? 'اعمل حسابك' : 'مرحبا برجوعك'}</h1><p className="muted">ادخل لـ VYNZO وتابع رصيدك ووقت المشاهدة.</p>
    <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label>
    <label>كلمة السر<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={isSignup?'new-password':'current-password'} /></label>
    {message && <p className="notice">{message}</p>}
    <button className="primary-btn" disabled={busy}>{busy ? 'لحظة...' : isSignup ? 'إنشاء حساب' : 'دخول'}</button>
    <button type="button" className="text-btn" onClick={()=>{setIsSignup(!isSignup);setMessage('');}}>{isSignup ? 'عندك حساب؟ ادخل' : 'ما عندكش حساب؟ سجّل توّا'}</button>
  </form></main>;

  const points = Number(wallet?.points_balance ?? 0);
  const value = Number(wallet?.estimated_value_usd ?? 0);
  const used = Number(box?.watch_seconds_used ?? 0);
  const required = Number(box?.required_seconds ?? 2400);
  const progress = Math.min(100, Math.round((used / Math.max(required, 1)) * 100));

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark small">V</div><div><b>VYNZO</b><small>شاهد. اكتشف. تقدّم.</small></div></div><button className="icon-btn" onClick={signOut} title="خروج"><LogOut size={18}/></button></header>
    <section className="welcome"><div><p className="eyebrow">مرحبا بيك</p><h1>نهارك زين، <span>واصل تقدّمك!</span></h1><p>كل دقيقة مشاهدة تتسجّل حسب نظام التطبيق.</p></div><div className="welcome-icon"><Glasses size={36}/></div></section>
    {message && <div className="notice">{message}</div>}
    <section className="stats-grid">
      <article className="stat-card"><div className="stat-icon"><Wallet size={19}/></div><span>رصيد النقاط</span><strong>{points.toLocaleString('en-US')}</strong><small>نقطة</small></article>
      <article className="stat-card"><div className="stat-icon purple"><Gift size={19}/></div><span>القيمة التقديرية</span><strong>${value.toFixed(2)}</strong><small>موش مبلغ قابل للسحب توّا</small></article>
    </section>
    <section className="panel watch-panel"><div className="section-heading"><div><span className="mini-label">وقت المشاهدة</span><h2>حصّتك اليومية</h2></div><button className="icon-btn" onClick={loadDashboard} disabled={refreshing}>{refreshing ? '…' : <RefreshCw size={17}/>}</button></div>
      <div className="progress-meta"><b>{Math.floor(used/60)} / 40 دقيقة</b><span>{progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:progress+'%'}}/></div>
      <div className="slot-grid">{slots.map((time,i)=><div className="slot" key={time}><Clock3 size={16}/><b>{time}</b><small>الحصّة {i+1}</small></div>)}</div>
      <p className="hint">تتحلّ 10 دقايق في كل حصّة. أقصى وقت في النهار 40 دقيقة، والوقت غير المستعمل ما يتنقلش لنهار آخر.</p>
    </section>
    <section className="panel reward-panel"><div className="section-heading"><div><span className="mini-label">مكافأة يومية</span><h2>الصندوق الذهبي</h2></div><div className="gift-orb"><Gift size={23}/></div></div>
      <p className="muted">كمّل 40 دقيقة مشاهدة مسجّلة باش تتحقّق من إمكانية الحصول على الصندوق اليومي.</p>
      <div className="box-status">{box?.box_status === 'claimed' ? 'الصندوق متاع اليوم خذيتو بالفعل.' : box?.eligible ? 'مبروك! الصندوق متاح ليك.' : 'كمّل وقت المشاهدة المطلوب باش تتحقّق الأهلية.'}</div>
      <button className="primary-btn" disabled={busy || !box?.eligible || !box?.box_id || box?.box_status === 'claimed'} onClick={claimBox}><Gift size={17}/>{busy ? 'لحظة...' : box?.box_status === 'claimed' ? 'تمّ استلامه' : 'استلام الصندوق · 50 نقطة'}</button>
      <small className="disclaimer">النقاط والقيمة المعروضة تقديرية. التحويل والسحب معطّلين حاليًا، وما فماش ضمان لأرباح نقدية.</small>
    </section>
    <nav className="bottom-nav"><div className="nav-item active"><PlayCircle size={20}/><span>الرئيسية</span></div><div className="nav-item"><Eye size={20}/><span>الفيديوهات</span></div><div className="nav-item"><Gift size={20}/><span>المكافآت</span></div><div className="nav-item"><Wallet size={20}/><span>المحفظة</span></div></nav>
    <footer>VYNZO • نسخة تجريبية أوّلية</footer>
  </main>;
}
