import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, Timestamp,
} from "firebase/firestore";

const DELETE_PASSWORD = "940822";
const fmtEUR  = (n) => new Intl.NumberFormat("es-ES", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
const fmtUSDT = (n) => new Intl.NumberFormat("es-ES", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
const todayDate = () => new Date().toLocaleDateString("es-ES");
const nowTime   = () => new Date().toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" });
const monthKey  = (d) => d.slice(3);
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function App() {
  const [txs, setTxs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("hoy");
  const [clock, setClock]     = useState(nowTime());
  const [flash, setFlash]     = useState(null);
  const [filterMonth, setFM]  = useState(() => {
    const d = new Date();
    return `${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  });
  const empty = { client:"", account:"", eurAmount:"", usdtIn:"", usdtOut:"", note:"" };
  const [form, setForm]               = useState(empty);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deletePass, setDeletePass]   = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setClock(nowTime()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "transacciones"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTxs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showFlash = (type, msg) => { setFlash({type,msg}); setTimeout(()=>setFlash(null), 3500); };

  const addTx = async () => {
    if (!form.client || !form.eurAmount || !form.usdtIn || !form.usdtOut)
      return showFlash("err", "Completá los campos obligatorios (*).");
    try {
      await addDoc(collection(db, "transacciones"), {
        date: todayDate(), time: nowTime(),
        client: form.client, account: form.account,
        eurAmount: parseFloat(form.eurAmount),
        usdtIn: parseFloat(form.usdtIn),
        usdtOut: parseFloat(form.usdtOut),
        note: form.note,
        createdAt: Timestamp.now(),
      });
      setForm(empty);
      showFlash("ok", "✓ Operación registrada y sincronizada.");
      setView("hoy");
    } catch {
      showFlash("err", "Error al guardar. Revisá la conexión.");
    }
  };

  const openDeleteModal = (tx) => {
    setDeleteModal({ id: tx.id, client: tx.client });
    setDeletePass("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (deletePass !== DELETE_PASSWORD) {
      setDeleteError("❌ Contraseña incorrecta.");
      return;
    }
    try {
      await deleteDoc(doc(db, "transacciones", deleteModal.id));
      setDeleteModal(null);
      showFlash("ok", "✓ Operación eliminada correctamente.");
    } catch {
      setDeleteError("Error al eliminar. Intentá de nuevo.");
    }
  };

  const byMonth = {};
  txs.forEach((t) => { const k=monthKey(t.date); if(!byMonth[k])byMonth[k]=[]; byMonth[k].push(t); });
  const months = Object.keys(byMonth).sort((a,b)=>{
    const[ma,ya]=a.split("/").map(Number),[mb,yb]=b.split("/").map(Number);
    return ya!==yb?yb-ya:mb-ma;
  });
  const todayStr = todayDate();
  const todayTxs = txs.filter(t=>t.date===todayStr);
  const mTxs     = byMonth[filterMonth]||[];
  const mSum     = calcSummary(mTxs);
  const [mm,yyyy]= filterMonth.split("/");
  const mLabel   = `${MONTHS_ES[parseInt(mm)-1]} ${yyyy}`;

  const C = {
    bg:"#060f1e", panel:"#040d1a", card:"#071324",
    row0:"#0e1a2e", row1:"#0a1525", border:"#1a3050",
    accent:"#ffd166", green:"#00e596", blue:"#6ab4e8",
    muted:"#4a7090", text:"#e8f4ff", sub:"#a8c8e0",
    recv:"#a8e6cf", sent:"#ffb3b3", red:"#ff6b6b",
  };

  const css = {
    root:{ fontFamily:"'IBM Plex Mono','Courier New',monospace", background:C.bg, minHeight:"100vh", color:C.sub, fontSize:13 },
    header:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", background:C.panel, borderBottom:`1px solid ${C.border}` },
    logo:{ fontSize:20, fontWeight:700, color:C.accent, letterSpacing:4 },
    tag:{ fontSize:9, color:C.muted, letterSpacing:2, marginTop:2 },
    liveChip:{ display:"flex", alignItems:"center", gap:6, background:"#00e59614", border:"1px solid #00e59640", borderRadius:4, padding:"3px 10px", fontSize:9, color:C.green, letterSpacing:2 },
    dot:{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:"0 0 6px #00e596" },
    clk:{ fontSize:15, color:C.blue, fontWeight:700, marginLeft:10 },
    nav:{ display:"flex", background:C.panel, borderBottom:`1px solid ${C.border}`, padding:"0 24px" },
    nbtn:{ background:"none", border:"none", color:C.muted, padding:"13px 18px", cursor:"pointer", fontSize:10, letterSpacing:2, borderBottom:"3px solid transparent", fontFamily:"inherit" },
    nact:{ color:C.accent, borderBottomColor:C.accent },
    sec:{ padding:"22px 24px" },
    sh:{ display:"flex", alignItems:"center", gap:10, marginBottom:12 },
    stitle:{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:1, margin:0 },
    badge:{ background:"#1a3050", color:C.blue, padding:"2px 10px", borderRadius:20, fontSize:9, letterSpacing:1 },
    wrap:{ overflowX:"auto", borderRadius:8, border:`1px solid ${C.border}` },
    tbl:{ width:"100%", borderCollapse:"collapse", fontSize:11 },
    th:{ padding:"9px 11px", textAlign:"left", background:"#071324", color:C.muted, fontSize:9, letterSpacing:1.5, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" },
    td:{ padding:"8px 11px", borderBottom:"1px solid #0e1e30", whiteSpace:"nowrap" },
    empty:{ color:C.muted, padding:"20px 0", fontSize:12 },
    div:{ borderTop:`1px solid ${C.border}`, margin:"24px 0" },
    pills:{ display:"flex", flexWrap:"wrap", gap:8, marginTop:14, alignItems:"center" },
    pill:{ display:"flex", flexDirection:"column", background:"#0a1830", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 13px", minWidth:110 },
    plbl:{ fontSize:8, color:C.muted, letterSpacing:1.5, marginBottom:2 },
    pval:{ fontSize:13, fontWeight:700 },
    cc:{ background:C.card, border:"1px solid #1e4070", borderRadius:12, padding:"22px 24px" },
    ccTitle:{ display:"flex", alignItems:"center", gap:10, marginBottom:18 },
    ccTxt:{ fontSize:12, fontWeight:700, color:C.accent, letterSpacing:2 },
    ccGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 },
    ci:{ background:"#0a1830", borderRadius:8, padding:"14px 16px", display:"flex", flexDirection:"column", gap:3, border:`1px solid ${C.border}` },
    ciHL:{ border:"1px solid #00e59640", background:"#00e59608" },
    cilbl:{ fontSize:8, color:C.muted, letterSpacing:1.5 },
    cival:{ fontSize:18, fontWeight:700 },
    cisub:{ fontSize:9, color:C.muted },
    ccdiv:{ borderTop:`1px solid ${C.border}`, margin:"14px 0" },
    ccfact:{ fontSize:11, color:C.muted },
    fgrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:14 },
    fw:{ display:"flex", flexDirection:"column", gap:4 },
    flbl:{ fontSize:9, color:C.muted, letterSpacing:1.5 },
    finp:{ background:"#0a1830", border:`1px solid ${C.border}`, borderRadius:6, padding:"9px 11px", color:C.text, fontSize:12, fontFamily:"inherit", outline:"none" },
    calc:{ display:"flex", alignItems:"center", gap:8, background:"#0a1830", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 14px", marginBottom:14 },
    sbtn:{ background:C.accent, color:C.bg, border:"none", borderRadius:8, padding:"12px 26px", fontSize:11, fontWeight:700, letterSpacing:2, cursor:"pointer", fontFamily:"inherit" },
    sel:{ background:"#0a1830", border:`1px solid ${C.border}`, color:C.text, padding:"5px 10px", borderRadius:6, fontSize:11, fontFamily:"inherit" },
    flash_ok:{ margin:"10px 24px 0", padding:"9px 16px", border:"1px solid #00e596", borderRadius:6, fontSize:12, background:"#00e59618", color:C.green },
    flash_err:{ margin:"10px 24px 0", padding:"9px 16px", border:"1px solid #ff4444", borderRadius:6, fontSize:12, background:"#ff444418", color:"#ff8888" },
    spinner:{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", color:C.muted, fontSize:13, letterSpacing:2 },
    delbtn:{ background:"none", border:"1px solid #ff444440", borderRadius:4, color:C.red, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:"inherit" },
    overlay:{ position:"fixed", inset:0, background:"#000000cc", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:{ background:"#0a1830", border:`1px solid ${C.border}`, borderRadius:12, padding:"28px 32px", width:320, display:"flex", flexDirection:"column", gap:14 },
    modalTitle:{ fontSize:14, fontWeight:700, color:C.red, letterSpacing:1 },
    modalSub:{ fontSize:11, color:C.muted },
    modalInp:{ background:"#060f1e", border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 12px", color:C.text, fontSize:14, fontFamily:"inherit", outline:"none", letterSpacing:4, textAlign:"center" },
    modalErr:{ fontSize:11, color:C.red },
    modalBtns:{ display:"flex", gap:10 },
    modalConfirm:{ flex:1, background:C.red, color:"#fff", border:"none", borderRadius:6, padding:"10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    modalCancel:{ flex:1, background:"none", color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px", fontSize:11, cursor:"pointer", fontFamily:"inherit" },
  };

  const TxRow = ({ tx, i }) => {
    const util = tx.usdtIn - tx.usdtOut;
    return (
      <tr style={{ background: i%2===0 ? C.row0 : C.row1 }}>
        <td style={{...css.td, color:C.muted}}>{tx.date}</td>
        <td style={{...css.td, color:"#5a7a99"}}>{tx.time}</td>
        <td style={{...css.td, fontWeight:600, color:C.text}}>{tx.client}</td>
        <td style={{...css.td, color:C.blue, fontSize:10}}>{tx.account||"—"}</td>
        <td style={{...css.td, color:C.accent}}>€{fmtEUR(tx.eurAmount)}</td>
        <td style={{...css.td, color:C.recv}}>{fmtUSDT(tx.usdtIn)}</td>
        <td style={{...css.td, color:C.sent}}>{fmtUSDT(tx.usdtOut)}</td>
        <td style={{...css.td, color:util>=0?C.green:C.red, fontWeight:700}}>{util>=0?"+":""}{fmtUSDT(util)}</td>
        <td style={{...css.td, color:"#5a7a99", fontSize:10}}>{tx.note||"—"}</td>
        <td style={css.td}>
          <button style={css.delbtn} onClick={()=>openDeleteModal(tx)}>🗑 Eliminar</button>
        </td>
      </tr>
    );
  };

  const TxTable = ({ rows }) => (
    <div style={css.wrap}>
      <table style={css.tbl}>
        <thead>
          <tr>{["Fecha","Hora","Cliente","Cuenta","EUR","USDT Recv.","USDT Env.","Utilidad","Nota",""].map(h=>(
            <th key={h} style={css.th}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>{rows.map((tx,i)=><TxRow key={tx.id} tx={tx} i={i}/>)}</tbody>
      </table>
    </div>
  );

  const MiniPills = ({ txs: list, lbl }) => {
    const tEur = list.reduce((s,t)=>s+t.eurAmount,0);
    const tIn  = list.reduce((s,t)=>s+t.usdtIn,0);
    const tOut = list.reduce((s,t)=>s+t.usdtOut,0);
    const util = tIn - tOut;
    return (
      <div style={css.pills}>
        <span style={{fontSize:10,color:C.muted,letterSpacing:1}}>{lbl}</span>
        {[
          [`€${fmtEUR(tEur)}`,"EUR procesados",C.accent],
          [`${fmtUSDT(tIn)} ₮`,"USDT recibido",C.recv],
          [`${fmtUSDT(tOut)} ₮`,"USDT enviado",C.sent],
          [(util>=0?"+":"")+fmtUSDT(util)+" ₮","Utilidad",util>=0?C.green:C.red],
        ].map(([v,l,c])=>(
          <div key={l} style={css.pill}>
            <span style={css.plbl}>{l}</span>
            <span style={{...css.pval,color:c}}>{v}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div style={{fontFamily:"monospace",background:"#060f1e",minHeight:"100vh",...css.spinner}}>
      CARGANDO DATOS...
    </div>
  );

  return (
    <div style={css.root}>

      {deleteModal && (
        <div style={css.overlay}>
          <div style={css.modal}>
            <div style={css.modalTitle}>🗑 Eliminar operación</div>
            <div style={css.modalSub}>Cliente: <strong style={{color:C.text}}>{deleteModal.client}</strong></div>
            <div style={css.modalSub}>Ingresá la contraseña para confirmar:</div>
            <input
              style={css.modalInp}
              type="password"
              placeholder="••••••"
              value={deletePass}
              onChange={e=>{ setDeletePass(e.target.value); setDeleteError(""); }}
              onKeyDown={e=>e.key==="Enter"&&confirmDelete()}
            />
            {deleteError && <div style={css.modalErr}>{deleteError}</div>}
            <div style={css.modalBtns}>
              <button style={css.modalCancel} onClick={()=>setDeleteModal(null)}>Cancelar</button>
              <button style={css.modalConfirm} onClick={confirmDelete}>ELIMINAR</button>
            </div>
          </div>
        </div>
      )}

      <header style={css.header}>
        <div>
          <div style={css.logo}>MCONVERSIONES</div>
          <div style={css.tag}>By: RODRIGUEZPINAA / VZLA 🇻🇪</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={css.liveChip}><span style={css.dot}/> EN VIVO</div>
          <span style={css.clk}>{clock}</span>
        </div>
      </header>

      {flash && <div style={flash.type==="ok"?css.flash_ok:css.flash_err}>{flash.msg}</div>}

      <nav style={css.nav}>
        {[["hoy","HOY"],["mes","CIERRE MENSUAL"],["new","+ NUEVA OP."]].map(([v,l])=>(
          <button key={v} style={{...css.nbtn,...(view===v?css.nact:{})}} onClick={()=>setView(v)}>{l}</button>
        ))}
      </nav>

      {view==="hoy" && (
        <section style={css.sec}>
          <div style={css.sh}>
            <h2 style={css.stitle}>Operaciones del día — {todayStr}</h2>
            <span style={css.badge}>{todayTxs.length} transacciones</span>
          </div>
          {todayTxs.length===0
            ? <div style={css.empty}>Sin operaciones hoy. Usá <strong>"+ NUEVA OP."</strong> para registrar.</div>
            : <><TxTable rows={todayTxs}/><MiniPills txs={todayTxs} lbl="Resumen del día"/></>}
          <div style={css.div}/>
          <div style={css.sh}>
            <h2 style={css.stitle}>Historial completo</h2>
            <span style={css.badge}>{txs.length} operaciones</span>
          </div>
          <TxTable rows={txs}/>
        </section>
      )}

      {view==="mes" && (
        <section style={css.sec}>
          <div style={css.sh}>
            <h2 style={css.stitle}>Cierre Mensual</h2>
            <select style={css.sel} value={filterMonth} onChange={e=>setFM(e.target.value)}>
              {months.map(m=>{ const[mm2,yy]=m.split("/"); return <option key={m} value={m}>{MONTHS_ES[parseInt(mm2)-1]} {yy}</option>; })}
            </select>
          </div>
          {mSum ? (
            <>
              <div style={css.cc}>
                <div style={css.ccTitle}>
                  <span style={css.ccTxt}>◆ CIERRE — {mLabel.toUpperCase()}</span>
                  <span style={css.badge}>{mSum.count} ops</span>
                </div>
                <div style={css.ccGrid}>
                  {[
                    ["Total procesado",`€ ${fmtEUR(mSum.totalEur)}`,"Euros recibidos",C.accent,false],
                    ["USDT convertido",`${fmtUSDT(mSum.totalUsdtIn)} ₮`,"USDT ingresado",C.recv,false],
                    ["USDT cambiado",`${fmtUSDT(mSum.totalUsdtOut)} ₮`,"USDT enviado",C.sent,false],
                    ["UTILIDAD NETA",(mSum.utility>=0?"+":"")+fmtUSDT(mSum.utility)+" ₮","USDT retenido",mSum.utility>=0?C.green:C.red,true],
                  ].map(([l,v,sub,c,hl])=>(
                    <div key={l} style={{...css.ci,...(hl?css.ciHL:{})}}>
                      <span style={css.cilbl}>{l}</span>
                      <span style={{...css.cival,color:c}}>{v}</span>
                      <span style={css.cisub}>{sub}</span>
                    </div>
                  ))}
                </div>
                <div style={css.ccdiv}/>
                <div style={css.ccfact}>
                  Ratio conversión: <strong style={{color:C.blue}}>{fmtUSDT(mSum.totalUsdtIn/mSum.totalEur)}</strong> USDT/EUR
                  &nbsp;·&nbsp; Margen: <strong style={{color:C.green}}>{((mSum.utility/mSum.totalUsdtIn)*100).toFixed(2)}%</strong>
                </div>
              </div>
              <div style={{marginTop:20}}>
                <div style={css.sh}><h3 style={{...css.stitle,fontSize:12}}>Detalle — {mLabel}</h3></div>
                <TxTable rows={mTxs}/>
              </div>
            </>
          ) : <div style={css.empty}>No hay transacciones para este mes.</div>}
        </section>
      )}

      {view==="new" && (
        <section style={css.sec}>
          <h2 style={{...css.stitle,marginBottom:18}}>Registrar nueva operación</h2>
          <div style={css.fgrid}>
            {[
              ["Cliente *","client","text","Nombre completo"],
              ["Cuenta / destino","account","text","Plataforma · @usuario"],
              ["Monto EUR *","eurAmount","number","0.00"],
              ["USDT recibido *","usdtIn","number","0.00"],
              ["USDT enviado *","usdtOut","number","0.00"],
              ["Nota","note","text","Opcional"],
            ].map(([lbl,key,type,ph])=>(
              <div key={key} style={css.fw}>
                <label style={css.flbl}>{lbl}</label>
                <input style={css.finp} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>
              </div>
            ))}
          </div>
          {form.usdtIn && form.usdtOut && (
            <div style={css.calc}>
              <span style={{fontSize:10,color:C.muted,letterSpacing:1}}>Utilidad estimada:</span>
              <span style={{fontSize:16,fontWeight:700,color:(parseFloat(form.usdtIn||0)-parseFloat(form.usdtOut||0))>=0?C.green:C.red}}>
                {fmtUSDT(parseFloat(form.usdtIn||0)-parseFloat(form.usdtOut||0))} USDT
              </span>
            </div>
          )}
          <button style={css.sbtn} onClick={addTx}>REGISTRAR OPERACIÓN</button>
        </section>
      )}

      <footer style={{textAlign:"center",padding:"16px",fontSize:9,color:"#1a3050",letterSpacing:2,borderTop:"1px solid #0e1e30"}}>
        MCONVERSIONES · By: RODRIGUEZPINAA / VZLA 🇻🇪 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function calcSummary(txs) {
  if (!txs.length) return null;
  const totalEur     = txs.reduce((s,t)=>s+t.eurAmount,0);
  const totalUsdtIn  = txs.reduce((s,t)=>s+t.usdtIn,0);
  const totalUsdtOut = txs.reduce((s,t)=>s+t.usdtOut,0);
  return { totalEur, totalUsdtIn, totalUsdtOut, utility: totalUsdtIn-totalUsdtOut, count: txs.length };
}
