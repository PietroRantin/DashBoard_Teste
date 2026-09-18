/* personalização de marca ------------------------------------------- */
(function () {
  const slot = document.getElementById('logoSlot');
  const img = document.getElementById('logoImg');
  const ph = document.getElementById('logoPh');
  const file = document.getElementById('logoFile');
  const tit = document.getElementById('titulo');
  const reset = document.getElementById('brandReset');
  const K = { logo: 'ignis.logo', tit: 'ignis.titulo' };
  const padraoTit = tit.textContent;

  const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } };

  const logoPadrao = img.getAttribute('src');
  function pintaLogo(src) {
    const s = src || logoPadrao;
    if (s) { img.src = s; img.hidden = false; ph.hidden = true; slot.classList.add('filled'); slot.classList.remove('empty'); }
    else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; slot.classList.remove('filled'); slot.classList.add('empty'); }
    atualizaReset();
  }
  function atualizaReset() {
    reset.hidden = !(ler(K.logo) || (ler(K.tit) && ler(K.tit) !== padraoTit));
  }

  pintaLogo(ler(K.logo));
  const tSalvo = ler(K.tit);
  if (tSalvo) { tit.textContent = tSalvo; document.title = tSalvo + ' — Ranking da equipe'; }
  atualizaReset();

  slot.addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    if (f.size > 1200000) { alert('Imagem muito grande. Use um arquivo de até 1 MB.'); file.value = ''; return; }
    const fr = new FileReader();
    fr.onload = () => { gravar(K.logo, fr.result); pintaLogo(fr.result); };
    fr.readAsDataURL(f);
    file.value = '';
  });

  function salvaTitulo() {
    const t = tit.textContent.trim() || padraoTit;
    tit.textContent = t;
    gravar(K.tit, t === padraoTit ? null : t);
    document.title = t + ' — Ranking da equipe';
    atualizaReset();
  }
  tit.addEventListener('blur', salvaTitulo);
  tit.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tit.blur(); } });

  reset.addEventListener('click', () => {
    gravar(K.logo, null); gravar(K.tit, null);
    tit.textContent = padraoTit; document.title = padraoTit + ' — Ranking da equipe';
    pintaLogo(null);
  });
})();

(async function () {
  const D = await (await fetch('data/data.json')).json();
const SEC = D.secao, COL = D.colab, EQ = D.equipe;
const WEEKS = [...new Set(COL.map(r => r.semana))].sort((a, b) => a - b);
const UNIS = [...new Set(SEC.map(r => r.universo))];

const ABREV = { 'Raquetivos': 'Raquet.', 'Montanha': 'Montan.', 'Saúde': 'Saúde', 'Rodas': 'Rodas', 'Corrida': 'Corrida', 'Água': 'Água', 'Fitness': 'Fitness' };
const UCOLOR = {
  'Montanha': '#1F9A6C', 'Saúde': '#7132EC', 'Fitness': '#B4249B',
  'Raquetivos': '#0E7C9B', 'Água': '#3643BA', 'Rodas': '#16175D', 'Corrida': '#D9531E'
};

/* rótulos e formatos ------------------------------------------------ */
const SEC_CRIT = [
  ['FATURAMENTO', 'Faturamento', 'pct', 'Venda realizada sobre a meta da semana'],
  ['DEMARCA', 'Demarca', 'pctsign', 'Diferença de estoque apurada no período'],
  ['ACURACIDADE', 'Acuracidade', 'pct', 'Estoque do sistema batendo com o físico'],
  ['FCS', 'FCS', 'pct', 'Fator crítico de sucesso da seção'],
  ['ACELERAÇÃO', 'Aceleração', 'pct', 'Entrega da rotina de aceleração'],
  ['TRUCK TO PEG', 'Truck to peg', 'num', 'Tempo entre a chegada e a exposição da mercadoria'],
  ['DEMARCA CONHECIDA', 'Demarca conhecida', 'pct', 'Registro das perdas identificadas'],
  ['DOT', 'DOT', 'pct', 'Entrega do dia a dia operacional']
];
const COL_CRIT = [
  ['SEÇÃO', 'Seção', null, 'Pontos do universo, iguais para todo mundo da seção'],
  ['PLUS VN', 'Plus em valor', 'brl', 'Valor vendido em serviços e produtos Plus'],
  ['PLUS QTD', 'Plus em quantidade', 'int', 'Quantidade de itens Plus vendidos'],
  ['CLUBE', 'Clube', 'pct', 'Cadastros no Clube sobre o total de vendas'],
  ['NPS', 'NPS', 'pct', 'Avaliação recebida dos clientes'],
  ['FORMAÇÃO', 'Formação', 'pct', 'Trilhas e treinamentos concluídos'],
  ['CAPITÃO', 'Capitão', 'int', 'Missões assumidas como capitão da semana'],
  ['ESPORTES/MVP', 'Esportes e MVP', null, 'Prática esportiva, esporte coletivo, parceria e MVP da semana']
];
const MVP_RAW = ['ESPORTE', 'ESPORTE COLETIVO', 'PARCERIA', 'MVP'];

const nf = (n, d = 0) => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
function fmt(v, kind) {
  if (v === null || v === undefined) return '—';
  switch (kind) {
    case 'pct': return nf(v * 100, 1) + '%';
    case 'pctsign': return (v > 0 ? '+' : '') + nf(v * 100, 2) + '%';
    case 'brl': return 'R$ ' + nf(v);
    case 'num': return nf(v, 2);
    case 'int': return nf(v);
    default: return nf(v);
  }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nome1 = n => { const p = n.split(' '); return p.length > 2 ? p[0] + ' ' + p[p.length - 1] : n; };

/* agregações -------------------------------------------------------- */
const pessoas = [...new Set(COL.map(r => r.nome))];
const porPessoa = {};
pessoas.forEach(n => {
  const rs = COL.filter(r => r.nome === n).sort((a, b) => a.semana - b.semana);
  const pts = {}; COL_CRIT.forEach(([k]) => pts[k] = rs.reduce((s, r) => s + (r.pts[k] || 0), 0));
  const total = rs.reduce((s, r) => s + r.total, 0);
  porPessoa[n] = {
    nome: n, universo: EQ[n] || rs[0].universo, linhas: rs, pts, total,
    ptsSecao: pts['SEÇÃO'], ptsInd: total - pts['SEÇÃO'],
    mvp: rs.reduce((s, r) => s + ((r.raw['MVP'] || 0) > 0 ? 1 : 0), 0)
  };
});
const rank = pessoas.map(n => porPessoa[n]).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
const maxTotal = rank[0].total;

const uniTotal = {}; UNIS.forEach(u => uniTotal[u] = SEC.filter(r => r.universo === u).reduce((s, r) => s + r.total, 0));
const uniRank = [...UNIS].sort((a, b) => uniTotal[b] - uniTotal[a]);

function rankingAte(w) {
  return pessoas.map(n => ({
    nome: n,
    total: COL.filter(r => r.nome === n && r.semana <= w).reduce((s, r) => s + r.total, 0)
  })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}
const posAcum = {};
WEEKS.forEach(w => { const r = rankingAte(w); posAcum[w] = {}; r.forEach((p, i) => posAcum[w][p.nome] = i + 1); });

/* cabeçalho --------------------------------------------------------- */
document.getElementById('periodo').textContent =
  `Ranking da equipe · semanas ${WEEKS[0]} a ${WEEKS[WEEKS.length - 1]} · ${pessoas.length} participantes`;
const ptsTotais = rank.reduce((s, p) => s + p.total, 0);
document.getElementById('topstats').innerHTML = [
  [nome1(rank[0].nome), 'Líder atual'],
  [nf(rank[0].total), 'Pontos do líder'],
  [nf(Math.round(ptsTotais / pessoas.length)), 'Média da equipe'],
  [nf(rank[0].total - rank[rank.length - 1].total), 'Do 1º ao último']
].map(([b, s]) => `<div class="tstat"><b>${esc(b)}</b><span>${s}</span></div>`).join('');


/* aba 1 — ranking geral --------------------------------------------- */
function tag(u) { return `<span class="uni-tag" style="color:${UCOLOR[u] || 'var(--muted)'}">${esc(u)}</span>`; }

function detalhe(p) {
  const linhasInd = COL_CRIT.filter(([k]) => k !== 'SEÇÃO').map(([k, lab, kind]) => {
    const pts = p.pts[k];
    let bruto = '—';
    if (kind === 'brl' || kind === 'int') bruto = fmt(p.linhas.reduce((s, r) => s + (r.raw[k] || 0), 0), kind);
    else if (kind === 'pct') {
      const vs = p.linhas.map(r => r.raw[k] || 0).filter(v => v > 0);
      bruto = vs.length ? 'méd. ' + fmt(vs.reduce((a, b) => a + b, 0) / vs.length, 'pct') : '—';
    } else if (k === 'ESPORTES/MVP') {
      bruto = p.mvp ? `${p.mvp}× MVP` : '—';
    }
    return `<tr><td>${lab}</td><td class="num z">${bruto}</td><td class="n ${pts ? '' : 'z'}">${nf(pts)}</td></tr>`;
  }).join('');

  const maxSem = Math.max(...p.linhas.map(r => r.total));
  const barras = p.linhas.map(r => {
    const h = maxSem ? Math.round(r.total / maxSem * 70) : 0;
    const hs = r.total ? Math.round(h * r.pts['SEÇÃO'] / r.total) : 0;
    return `<div class="wkbar"><div class="vv">${nf(r.total)}</div>
      <div class="stack" style="height:${h}px">
        <i style="background:var(--ind);height:${h - hs}px"></i>
        <i style="background:var(--blue);height:${hs}px"></i>
      </div><div class="lb">S${r.semana}</div></div>`;
  }).join('');

  return `<div class="detail">
    <div class="dgrid">
      <div>
        <h4 class="dtitle">Onde os pontos individuais foram ganhos</h4>
        <table class="mini"><thead><tr><th>Critério</th><th style="text-align:right">Resultado</th><th style="text-align:right">Pontos</th></tr></thead>
        <tbody>${linhasInd}</tbody></table>
      </div>
      <div>
        <h4 class="dtitle">Pontos por semana</h4>
        <div class="wkbars">${barras}</div>
        <p style="font-size:12.5px;color:var(--muted);margin:12px 0 0">
          ${nf(p.ptsSecao)} pontos vieram do universo ${esc(p.universo)} e ${nf(p.ptsInd)} da performance individual
          (${Math.round(p.ptsInd / p.total * 100)}% do total).</p>
      </div>
    </div></div>`;
}

document.getElementById('p-ranking').innerHTML = `
  <h2 class="sec">Classificação acumulada</h2>
  <p class="lede">Toque em qualquer linha para abrir o detalhamento por critério e por semana. A barra mostra quanto do total veio da seção e quanto veio do desempenho individual.</p>
  <div class="board">
    <div class="board-head"><span style="text-align:right">#</span><span>Participante</span><span>Universo</span><span>Seção / individual</span><span style="text-align:right">Pontos</span></div>
    ${rank.map((p, i) => `
      <div class="row" data-medal="${i + 1}" data-nome="${esc(p.nome)}">
        <button class="row-btn" aria-expanded="false">
          <span class="pos">${i + 1}</span>
          <span class="who"><span class="nm">${esc(p.nome)}</span>${p.mvp ? `<span class="mv">${p.mvp}× MVP da semana</span>` : ''}</span>
          <span class="uni-cell">${tag(p.universo)}</span>
          <span class="bar" title="${nf(p.ptsSecao)} pontos de universo · ${nf(p.ptsInd)} individuais">
            <i class="b-sec" style="width:${p.ptsSecao / maxTotal * 100}%">${p.ptsSecao / maxTotal > .12 ? nf(p.ptsSecao) : ''}</i>
            <i class="b-ind" style="width:${p.ptsInd / maxTotal * 100}%">${p.ptsInd / maxTotal > .07 ? nf(p.ptsInd) : ''}</i>
          </span>
          <span class="tot">${nf(p.total)}</span>
        </button>
      </div>`).join('')}
  </div>
  <div class="legend">
    <span><i style="background:var(--blue)"></i>Pontos do universo (iguais para toda a seção)</span>
    <span><i style="background:var(--ind)"></i>Pontos individuais</span>
  </div>`;

document.querySelectorAll('#p-ranking .row-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.row');
    const aberto = row.classList.contains('open');
    if (aberto) { row.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); row.querySelector('.detail').remove(); }
    else {
      row.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      row.insertAdjacentHTML('beforeend', detalhe(porPessoa[row.dataset.nome]));
    }
  });
});

/* aba 2 — semana a semana -------------------------------------------- */
let semanaSel = WEEKS[WEEKS.length - 1];
function renderSemana() {
  const w = semanaSel, idx = WEEKS.indexOf(w), ant = WEEKS[idx - 1];
  const linhas = COL.filter(r => r.semana === w).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  const maxSem = Math.max(...linhas.map(r => r.total), 1);
  const secs = SEC.filter(r => r.semana === w).sort((a, b) => b.total - a.total);
  const maxS = Math.max(...secs.map(r => r.total), 1);

  const tabelaPessoas = linhas.map((r, i) => {
    const p = porPessoa[r.nome];
    let d = '';
    if (ant !== undefined) {
      const dif = posAcum[ant][r.nome] - posAcum[w][r.nome];
      if (dif > 0) d = `<span class="delta up">▲${dif}</span>`;
      else if (dif < 0) d = `<span class="delta down">▼${-dif}</span>`;
    }
    const ind = r.total - r.pts['SEÇÃO'];
    return `<tr>
      <td class="rk">${i + 1}</td>
      <td>${esc(nome1(r.nome))}<span style="color:${UCOLOR[p.universo]};font-size:11.5px;font-weight:600"> · ${esc(p.universo)}</span></td>
      <td class="num" style="color:var(--muted)">${nf(r.pts['SEÇÃO'])}</td>
      <td class="num" style="color:var(--ind);font-weight:700">${nf(ind)}</td>
      <td class="big">${nf(r.total)}</td>
      <td style="width:26px">${d}</td></tr>`;
  }).join('');

  const tabelaSec = secs.map((r, i) => `<tr>
      <td class="rk">${i + 1}</td>
      <td style="font-weight:600;color:${UCOLOR[r.universo]}">${esc(r.universo)}</td>
      <td style="width:45%"><span class="bar" style="height:10px"><i class="b-sec" style="width:${r.total / maxS * 100}%"></i></span></td>
      <td class="big">${nf(r.total)}</td></tr>`).join('');

  const detSec = SEC_CRIT.map(([k, lab]) => {
    const cels = secs.map(r => {
      const v = r.pts[k];
      return `<td><span class="cell"><b style="${v ? '' : 'color:var(--muted);font-weight:400'}">${nf(v)}</b></span></td>`;
    }).join('');
    return `<tr><td class="lft">${lab}</td>${cels}</tr>`;
  }).join('');

  const totPes = linhas.reduce((s, r) => s + r.total, 0);
  document.getElementById('p-semana').innerHTML = `
    <h2 class="sec">O que aconteceu em cada semana</h2>
    <p class="lede">Escolha a semana para ver a pontuação daquele período isoladamente. A seta indica a variação da posição no ranking acumulado em relação à semana anterior.</p>
    <div class="chips">${WEEKS.map(x => `<button class="chip" data-w="${x}" aria-pressed="${x === w}">Semana ${x}</button>`).join('')}</div>
    <div class="top-stats" style="margin:0 0 22px;gap:34px">
      <div class="tstat"><b>${nf(totPes)}</b><span>Pontos distribuídos na semana</span></div>
      <div class="tstat"><b>${esc(nome1(linhas[0].nome))}</b><span>Melhor da semana (${nf(linhas[0].total)} pts)</span></div>
      <div class="tstat"><b>${esc(secs[0].universo)}</b><span>Melhor universo (${nf(secs[0].total)} pts)</span></div>
    </div>
    <div class="two">
      <div class="card">
        <h3>Pontuação individual</h3>
        <p class="hint">Seção e individual separados, como entram no total.</p>
        <table class="full"><thead><tr><th></th><th>Participante</th><th style="text-align:right">Seção</th><th style="text-align:right">Individual</th><th style="text-align:right">Total</th><th></th></tr></thead>
        <tbody>${tabelaPessoas}</tbody></table>
      </div>
      <div class="card">
        <h3>Universos na semana</h3>
        <p class="hint">Pontos que cada seção gerou e distribuiu para o seu time.</p>
        <table class="full"><tbody>${tabelaSec}</tbody></table>
        <h3 style="margin-top:26px">Por critério da seção</h3>
        <p class="hint">Onde cada universo ganhou ou deixou pontos nesta semana.</p>
        <div class="scroll"><table class="heat" style="min-width:420px">
          <thead><tr><th class="lft">Critério</th>${secs.map(r => `<th style="color:${UCOLOR[r.universo]}">${esc(ABREV[r.universo] || r.universo)}</th>`).join('')}</tr></thead>
          <tbody>${detSec}</tbody></table></div>
      </div>
    </div>`;
  document.querySelectorAll('#p-semana .chip').forEach(c => c.addEventListener('click', () => { semanaSel = +c.dataset.w; renderSemana(); }));
}
renderSemana();

/* aba 3 — universos -------------------------------------------------- */
const maxPorCrit = {}; SEC_CRIT.forEach(([k]) => maxPorCrit[k] = Math.max(...SEC.map(r => r.pts[k]), 1));

document.getElementById('p-universo').innerHTML = `
  <h2 class="sec">Pontuação por universo</h2>
  <p class="lede">Cada universo gera pontos de seção que vão para todos os colaboradores daquele time. A tabela mostra, semana a semana, o resultado apurado em cada critério e quantos pontos ele valeu.</p>
  ${uniRank.map((u, i) => {
  const rs = SEC.filter(r => r.universo === u).sort((a, b) => a.semana - b.semana);
  const time = pessoas.filter(n => porPessoa[n].universo === u).sort((a, b) => porPessoa[b].total - porPessoa[a].total);
  const corpo = SEC_CRIT.map(([k, lab, kind, desc]) => {
    const cels = rs.map(r => {
      const p = r.pts[k], op = p ? 0.12 + 0.88 * (p / maxPorCrit[k]) : 0;
      return `<td style="background:${p ? `color-mix(in srgb, ${UCOLOR[u]} ${Math.round(op * 26)}%, transparent)` : 'transparent'}">
        <span class="cell"><b style="${p ? '' : 'color:var(--muted);font-weight:400'}">${nf(p)}</b><span>${fmt(r.raw[k], kind)}</span></span></td>`;
    }).join('');
    return `<tr><td class="lft" title="${esc(desc)}">${lab}</td>${cels}</tr>`;
  }).join('');
  const somas = rs.map(r => `<td><span class="cell"><b>${nf(r.total)}</b></span></td>`).join('');
  return `<div class="uni-block">
      <div class="uni-head">
        <span class="pos" style="color:${UCOLOR[u]}">${i + 1}</span>
        <span class="nm" style="color:${UCOLOR[u]}">${esc(u)}</span>
        <span class="team">${time.map(n => esc(nome1(n))).join(' · ')}</span>
        <span class="tot">${nf(uniTotal[u])}</span>
      </div>
      <div class="scroll"><table class="heat">
        <thead><tr><th class="lft">Critério</th>${rs.map(r => `<th>Semana ${r.semana}</th>`).join('')}</tr></thead>
        <tbody>${corpo}<tr class="sum"><td class="lft">Total da seção</td>${somas}</tr></tbody>
      </table></div>
    </div>`;
}).join('')}`;

/* aba 4 — critérios --------------------------------------------------- */
const indCrit = COL_CRIT.filter(([k]) => k !== 'SEÇÃO');
const totalIndPorCrit = {}; indCrit.forEach(([k]) => totalIndPorCrit[k] = COL.reduce((s, r) => s + (r.pts[k] || 0), 0));
const totalSecPorCrit = {}; SEC_CRIT.forEach(([k]) => totalSecPorCrit[k] = SEC.reduce((s, r) => s + (r.pts[k] || 0), 0));
const maxCrit = Math.max(...Object.values(totalIndPorCrit), ...Object.values(totalSecPorCrit), 1);

function blocoCrit(lista, totais, fonte) {
  return lista.map(([k, lab, kind, desc]) => {
    const t = totais[k];
    const linhas = fonte === 'col'
      ? rank.filter(p => p.pts[k] > 0).sort((x, y) => y.pts[k] - x.pts[k]).map(p => [nome1(p.nome), p.pts[k], UCOLOR[p.universo]])
      : uniRank.map(u => [u, SEC.filter(r => r.universo === u).reduce((s, r) => s + r.pts[k], 0), UCOLOR[u]]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
    const maxL = Math.max(...linhas.map(x => x[1]), 1);
    return `<div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">
        <h3 style="margin:0">${lab}</h3>
        <span class="tot" style="margin-left:auto;font-size:20px">${nf(t)}</span>
      </div>
      <p class="hint" style="margin:2px 0 12px">${esc(desc)}</p>
      <span class="bar" style="height:6px;margin-bottom:14px"><i style="background:${fonte === 'col' ? 'var(--ind)' : 'var(--blue)'};width:${t / maxCrit * 100}%"></i></span>
      ${linhas.length ? `<table class="full"><tbody>${linhas.map(([n, v, c]) => `
        <tr><td style="width:38%">${esc(n)}</td>
        <td><span class="bar" style="height:9px"><i style="background:${c};width:${v / maxL * 100}%"></i></span></td>
        <td class="num" style="width:44px;font-weight:600">${nf(v)}</td></tr>`).join('')}</tbody></table>`
        : `<p style="font-size:13px;color:var(--muted);margin:0">Nenhum ponto distribuído neste critério até agora.</p>`}
    </div>`;
  }).join('');
}

document.getElementById('p-criterio').innerHTML = `
  <h2 class="sec">Peso de cada critério</h2>
  <p class="lede">Quanto cada forma de pontuar rendeu até aqui e quem se destacou nela. A barra larga compara o critério com os demais; as barras finas mostram a distribuição entre participantes ou universos.</p>
  <div class="two">
    <div>
      <h3 style="font-family:var(--cond);font-weight:500;font-size:18px;margin:0 0 12px">Critérios individuais</h3>
      ${blocoCrit(indCrit, totalIndPorCrit, 'col')}
    </div>
    <div>
      <h3 style="font-family:var(--cond);font-weight:500;font-size:18px;margin:0 0 12px">Critérios de seção</h3>
      ${blocoCrit(SEC_CRIT, totalSecPorCrit, 'sec')}
    </div>
  </div>`;

/* navegação ----------------------------------------------------------- */
document.querySelectorAll('nav.tabs button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('nav.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.tab));
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
});
})();
