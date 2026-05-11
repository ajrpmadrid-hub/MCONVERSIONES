

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
