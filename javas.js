// ════════════════════════════════════════
// DADOS
// ════════════════════════════════════════

// Lista de permissões disponíveis no sistema
const ALL_PERMISSIONS = [
  { id: 'view_tickets',    label: 'Ver Chamados',         desc: 'Visualizar chamados do sistema' },
  { id: 'create_tickets',  label: 'Abrir Chamados',       desc: 'Abrir novos chamados de suporte' },
  { id: 'edit_tickets',    label: 'Editar Chamados',      desc: 'Alterar status e dados de chamados' },
  { id: 'delete_tickets',  label: 'Excluir Chamados',     desc: 'Excluir chamados permanentemente' },
  { id: 'chat',            label: 'Usar Chat',            desc: 'Enviar e receber mensagens nos chats' },
  { id: 'forward_tickets', label: 'Encaminhar Chamados',  desc: 'Encaminhar chamados para outros departamentos' },
  { id: 'close_tickets',   label: 'Finalizar Chat',       desc: 'Encerrar chats e gerar protocolo de atendimento' },
  { id: 'view_reports',    label: 'Ver Relatórios',       desc: 'Acessar relatórios e métricas' },
  { id: 'manage_users',    label: 'Gerenciar Usuários',   desc: 'Criar, editar e excluir usuários' },
  { id: 'admin_panel',     label: 'Painel Admin',         desc: 'Acessar o painel administrativo' },
  { id: 'ai_support',      label: 'Suporte IA',           desc: 'Usar o assistente de inteligência artificial' },
  { id: 'attendant_panel', label: 'Painel Atendente',     desc: 'Acessar o painel de atendimento' },
];

// Permissões padrão por perfil
const DEFAULT_PERMISSIONS = {
  admin:     ALL_PERMISSIONS.map(p => p.id), // admin tem tudo
  attendant: ['view_tickets','edit_tickets','chat','forward_tickets','close_tickets','attendant_panel'],
  user:      ['view_tickets','create_tickets','chat','ai_support'],
};

let USERS = [
  { id:1, name:'Weslley Admin', email:'weslley@foxsmart.com', pass:'123', role:'admin', color:'#FF3B00',
    phone:'', dept:'TI', position:'Administrador', bio:'', photo:'',
    permissions: [...DEFAULT_PERMISSIONS.admin] },
  { id:2, name:'Usuário', email:'usuario@foxsmart.com', pass:'123', role:'user', color:'#3B82F6',
    phone:'', dept:'TI', position:'Usuário', bio:'', photo:'',
    permissions: [...DEFAULT_PERMISSIONS.user] },
  { id:3, name:'Atendente', email:'atendente@foxsmart.com', pass:'123', role:'attendant', color:'#8B5CF6',
    phone:'', dept:'TI', position:'Atendente de Suporte', bio:'', photo:'',
    permissions: [...DEFAULT_PERMISSIONS.attendant] },
];

let TICKETS = [
  { id:'FSX-001', userId:2, name:'Usuário', email:'usuario@foxsmart.com', title:'Computador não inicializa', cat:'Hardware', dept:'TI', prio:'high', status:'progress', date: new Date().toISOString().split('T')[0], desc:'O computador fica travado na tela de inicialização do Windows e não consegue entrar no sistema operacional.' },
  { id:'FSX-002', userId:2, name:'Usuário', email:'usuario@foxsmart.com', title:'Sem acesso ao e-mail corporativo', cat:'E-mail', dept:'Comercial', prio:'med', status:'open', date: new Date().toISOString().split('T')[0], desc:'Não consigo fazer login na conta de e-mail corporativa. A mensagem de erro é: autenticação falhou.' },
];

let currentUser = null;
let currentPrio = 'low';
let ticketCounter = 3;
let userCounter = 4;
let allTickets = [...TICKETS];
let histFilter = '';
let histStatus = '';
let editingUserId = null;
let newUserPhotoBase64 = '';

// Chat protocols storage
let PROTOCOLS = []; // { id, ticketId, ticketTitle, closedBy, closedByName, closedAt, summary }

const TIPS = [
  'Mantenha seu sistema operacional sempre atualizado!',
  'Faça backup dos arquivos importantes semanalmente.',
  'Use senhas fortes com letras, números e símbolos.',
  'Desconecte dispositivos USB com segurança para evitar perda de dados.',
  'Reiniciar o computador pode resolver muitos problemas básicos.',
];

// ════════════════════════════════════════
// LANDING / LOGIN MODAL
// ════════════════════════════════════════
function showLoginModal() {
  document.getElementById('login-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('login-email').focus(), 100);
}

function hideLoginModal() {
  document.getElementById('login-modal-overlay').classList.remove('open');
  document.getElementById('login-error').style.display = 'none';
}

function closeLoginModal(e) {
  if (e.target === e.currentTarget) hideLoginModal();
}

// ════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const err   = document.getElementById('login-error');

  const user = USERS.find(u => u.email === email && u.pass === pw);
  if (!user) { err.style.display='block'; return; }

  err.style.display='none';
  currentUser = user;

  // Esconde landing e modal, mostra app
  document.getElementById('page-landing').style.display = 'none';
  document.getElementById('login-modal-overlay').classList.remove('open');
  document.getElementById('app').style.display = 'flex';

  updateNavbar();
  initView();
}

function updateNavbar() {
  const u = currentUser;
  const avatarEl = document.getElementById('nav-avatar');
  if (u.photo) {
    avatarEl.innerHTML = `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
  } else {
    avatarEl.textContent = u.name.charAt(0);
  }
  document.getElementById('nav-name').textContent = u.name.split(' ')[0];
  const roleBadge = document.getElementById('nav-role');
  if (u.role === 'admin') { roleBadge.textContent = 'Admin'; roleBadge.className = 'nav-role-badge admin'; }
  else if (u.role === 'attendant') { roleBadge.textContent = 'Atendente'; roleBadge.className = 'nav-role-badge attendant'; }
  else { roleBadge.textContent = 'Usuário'; roleBadge.className = 'nav-role-badge'; }

  const isAdmin     = u.role === 'admin';
  const isAttendant = u.role === 'attendant';
  const isUser      = u.role === 'user';

  document.getElementById('nav-open').style.display       = isUser ? 'flex' : 'none';
  document.getElementById('nav-ai').style.display         = isUser ? 'flex' : 'none';
  document.getElementById('nav-hist').style.display       = 'flex';
  document.getElementById('nav-admin').style.display      = (isAdmin || isAttendant) ? 'flex' : 'none';
  document.getElementById('nav-reports').style.display    = isAdmin ? 'flex' : 'none';
  document.getElementById('nav-attendant').style.display  = isAttendant ? 'flex' : 'none';
}

function togglePw() {
  const inp = document.getElementById('login-pw');
  inp.type = inp.type==='password'?'text':'password';
}

document.addEventListener('keydown', e => {
  const overlay = document.getElementById('login-modal-overlay');
  if (e.key === 'Enter' && overlay.classList.contains('open')) doLogin();
  if (e.key === 'Escape' && overlay.classList.contains('open')) hideLoginModal();
});

function doLogout() {
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('page-landing').style.display = 'block';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pw').value = '';
}

// ════════════════════════════════════════
// NAV & VIEWS
// ════════════════════════════════════════
function showView(v) {
  const role = currentUser.role;
  const isAdmin     = role === 'admin';
  const isAttendant = role === 'attendant';
  const isUser      = role === 'user';

  // Access control
  if (isUser && (v === 'admin' || v === 'reports' || v === 'attendant')) return;
  if (isAdmin && (v === 'open' || v === 'ai' || v === 'attendant')) return;
  if (isAttendant && (v === 'open' || v === 'ai' || v === 'reports')) return;

  ['open','hist','ai','admin','reports','attendant'].forEach(id => {
    const view = document.getElementById('view-'+id);
    if (view) view.classList.remove('active');
    const btn = document.getElementById('nav-'+id);
    if (btn) btn.classList.remove('active');
  });
  document.getElementById('view-'+v).classList.add('active');
  const btn = document.getElementById('nav-'+v);
  if (btn) btn.classList.add('active');

  if (v==='hist')      renderTickets();
  if (v==='admin')     renderAdmin();
  if (v==='ai')        renderAiStats();
  if (v==='reports')   renderReports();
  if (v==='attendant') renderAttendantPanel();
}

function initView() {
  const role = currentUser.role;
  if (role === 'admin') {
    showView('admin');
  } else if (role === 'attendant') {
    showView('attendant');
  } else {
    showView('open');
    document.getElementById('tf-name').value  = currentUser.name;
    document.getElementById('tf-email').value = currentUser.email;
    document.getElementById('ai-tip').textContent = TIPS[Math.floor(Math.random()*TIPS.length)];
    // Usuário comum não pode definir prioridade — bloqueado para atendente
    ['low','med','high'].forEach(x => {
      const b = document.getElementById('pb-'+x);
      b.disabled = true;
      b.style.opacity = '0.4';
      b.style.cursor = 'not-allowed';
      b.title = 'A prioridade é definida pelo atendente';
    });
    const prioGroup = document.querySelector('.priority-btns').closest('.form-group');
    const notice = document.createElement('p');
    notice.style.cssText = 'font-size:11px;color:var(--grey-500);margin-top:6px;font-family:"IBM Plex Mono",monospace';
    notice.textContent = '🔒 A prioridade será definida pelo atendente após análise do chamado.';
    prioGroup.appendChild(notice);
  }
}

// ════════════════════════════════════════
// ABRIR CHAMADO
// ════════════════════════════════════════
function setPrio(p) {
  currentPrio = p;
  ['low','med','high'].forEach(x => {
    const b = document.getElementById('pb-'+x);
    b.className = 'priority-btn';
    if(x===p) b.classList.add('sel-'+x);
  });
}

function submitTicket() {
  if (currentUser.role === 'admin' || currentUser.role === 'attendant') return;
  const title = document.getElementById('tf-title').value.trim();
  const cat   = document.getElementById('tf-cat').value;
  const desc  = document.getElementById('tf-desc').value.trim();
  const dept  = document.getElementById('tf-dept').value;

  if (!title || !cat || !desc || !dept) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const id = 'FSX-00'+ticketCounter;
  ticketCounter++;
  const ticket = {
    id, userId:currentUser.id, name:currentUser.name, email:currentUser.email,
    title, cat, dept, prio:currentPrio,
    status:'open', date: new Date().toISOString().split('T')[0], desc
  };
  allTickets.unshift(ticket);

  document.getElementById('ticket-num').textContent = id;
  const toast = document.getElementById('ticket-success');
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 4000);

  document.getElementById('tf-title').value='';
  document.getElementById('tf-cat').value='';
  document.getElementById('tf-desc').value='';
  document.getElementById('tf-dept').value='';
  setPrio('low');
}

// ════════════════════════════════════════
// HISTÓRICO
// ════════════════════════════════════════
function renderTickets() {
  const isAdmin     = currentUser.role==='admin';
  const isAttendant = currentUser.role==='attendant';
  const seeAll      = isAdmin || isAttendant;
  document.getElementById('hist-sub').textContent = seeAll ? 'Todos os chamados do sistema' : 'Seus chamados registrados';

  let list = seeAll ? allTickets : allTickets.filter(t=>t.userId===currentUser.id);
  if (histStatus) list = list.filter(t=>t.status===histStatus);
  if (histFilter) {
    const q = histFilter.toLowerCase();
    list = list.filter(t=>t.title.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)||t.cat.toLowerCase().includes(q));
  }

  const body = document.getElementById('tickets-body');
  const prioLabel = {low:'Baixa',med:'Média',high:'Alta'};
  const statLabel = {open:'Aberto',progress:'Em andamento',closed:'Resolvido',cancelled:'Cancelado'};

  body.innerHTML = list.map(t => {
    const unread = (CHATS[t.id]||[]).filter(m=>!m.read&&m.senderId!==currentUser.id).length;
    const chatBtn = `<button class="btn-icon btn-chat-sm" onclick="openChatModal('${t.id}')" title="Abrir chat">💬${unread>0?` <span class="chat-unread-badge">${unread}</span>`:''}</button>`;
    return `
    <tr>
      <td><span class="t-id">${t.id}</span></td>
      <td><div class="t-title">${t.title}</div><div class="t-sub">${t.dept}</div></td>
      <td style="color:var(--grey-400);font-size:12px">${t.cat}</td>
      <td><span class="priority-dot prio-${t.prio}">${prioLabel[t.prio]}</span></td>
      <td><span class="status-badge status-${t.status}">${statLabel[t.status]||t.status}</span></td>
      <td style="color:var(--grey-400);font-size:12px;font-family:'IBM Plex Mono',monospace">${formatDate(t.date)}</td>
      <td style="display:flex;gap:6px"><button class="btn-icon" onclick="openModal('${t.id}')">🔍 Ver</button>${chatBtn}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--grey-600);padding:36px;font-family:'IBM Plex Mono',monospace;font-size:12px">// NENHUM CHAMADO ENCONTRADO</td></tr>`;
}

function filterTickets(q) { histFilter=q; renderTickets(); }
function filterStatus(s)  { histStatus=s; renderTickets(); }

// ════════════════════════════════════════
// MODAL DETALHE CHAMADO
// ════════════════════════════════════════
function openModal(id) {
  const t = allTickets.find(x=>x.id===id);
  if(!t) return;

  document.getElementById('modal-title').textContent = t.id+' — '+t.title;
  document.getElementById('modal-date').textContent  = 'Aberto em '+formatDate(t.date)+' por '+t.name;

  const statMap = {open:'Aberto',progress:'Em andamento',closed:'Resolvido',cancelled:'Cancelado'};
  const prioMap = {low:'🟢 Baixa',med:'🟡 Média',high:'🔴 Alta'};
  document.getElementById('modal-grid').innerHTML = `
    <div class="detail-item"><div class="detail-label">Categoria</div><div class="detail-value">${t.cat}</div></div>
    <div class="detail-item"><div class="detail-label">Departamento</div><div class="detail-value">${t.dept}</div></div>
    <div class="detail-item"><div class="detail-label">Prioridade</div><div class="detail-value">${prioMap[t.prio]}</div></div>
    <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${statMap[t.status]}</div></div>
    <div class="detail-item"><div class="detail-label">E-mail</div><div class="detail-value">${t.email}</div></div>
    <div class="detail-item"><div class="detail-label">Responsável</div><div class="detail-value">${t.name}</div></div>
  `;
  document.getElementById('modal-desc').textContent = t.desc;

  const acts = document.getElementById('modal-actions');
  acts.innerHTML = '';
  if(currentUser.role==='admin') {
    acts.innerHTML = `
      <button class="btn-icon btn-chat" onclick="openChatModal('${t.id}')">💬 Chat</button>
      <button class="btn-icon" onclick="changeStatus('${t.id}','open');closeModal()">🔵 Aberto</button>
      <button class="btn-icon" onclick="changeStatus('${t.id}','progress');closeModal()">⏳ Andamento</button>
      <button class="btn-icon" onclick="changeStatus('${t.id}','closed');closeModal()" style="color:var(--green)">✅ Resolver</button>
      <select class="btn-icon" onchange="changePrio('${t.id}', this.value)" title="Alterar prioridade" style="cursor:pointer">
        <option value="" disabled>🏷️ Prioridade...</option>
        <option value="low"  ${t.prio==='low'  ? 'selected':''}>🟢 Baixa</option>
        <option value="med"  ${t.prio==='med'  ? 'selected':''}>🟡 Média</option>
        <option value="high" ${t.prio==='high' ? 'selected':''}>🔴 Alta</option>
      </select>
      <button class="btn-icon btn-delete-ticket" onclick="deleteTicket('${t.id}')">🗑️ Excluir</button>
    `;
  } else if(currentUser.role==='attendant') {
    acts.innerHTML = `
      <button class="btn-icon btn-chat" onclick="openChatModal('${t.id}')">💬 Chat</button>
      <button class="btn-icon" onclick="changeStatus('${t.id}','progress');closeModal();renderAttendantPanel()">⏳ Em Atendimento</button>
      <button class="btn-icon" onclick="changeStatus('${t.id}','closed');closeModal();renderAttendantPanel()" style="color:var(--green)">✅ Resolver</button>
      <button class="btn-icon btn-forward" onclick="openForwardModal('${t.id}')">📤 Encaminhar Dept.</button>
      <select class="btn-icon" onchange="changePrio('${t.id}', this.value)" title="Alterar prioridade" style="cursor:pointer">
        <option value="" disabled>🏷️ Prioridade...</option>
        <option value="low"  ${t.prio==='low'  ? 'selected':''}>🟢 Baixa</option>
        <option value="med"  ${t.prio==='med'  ? 'selected':''}>🟡 Média</option>
        <option value="high" ${t.prio==='high' ? 'selected':''}>🔴 Alta</option>
      </select>
    `;
  } else if(currentUser.role==='user' && t.userId === currentUser.id) {
    const unread = (CHATS[t.id]||[]).filter(m=>!m.read&&m.senderId!==currentUser.id).length;
    acts.innerHTML = `
      <button class="btn-icon btn-chat" onclick="openChatModal('${t.id}')">💬 Chat com Suporte${unread>0?` <span class="chat-unread-badge">${unread}</span>`:''}</button>
    `;
  }

  document.getElementById('modal-overlay').classList.add('open');
}

function changeStatus(id, status) {
  const t = allTickets.find(x=>x.id===id);
  if(t) t.status = status;
  renderTickets();
  const role = currentUser.role;
  if(role==='admin') { renderAdmin(); renderReports(); }
  if(role==='attendant') { renderAttendantPanel(); }
}

function changePrio(id, prio) {
  const t = allTickets.find(x=>x.id===id);
  if(!t || !prio) return;
  t.prio = prio;
  renderTickets();
  const role = currentUser.role;
  if(role==='admin') { renderAdmin(); renderReports(); }
  if(role==='attendant') { renderAttendantPanel(); }
}

function deleteTicket(id) {
  if(!confirm('Tem certeza que deseja excluir este chamado? Essa ação não pode ser desfeita.')) return;
  allTickets = allTickets.filter(x=>x.id!==id);
  closeModal();
  renderTickets();
  const role = currentUser.role;
  if(role==='admin') renderAdmin();
  if(role==='attendant') renderAttendantPanel();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
document.getElementById('modal-overlay').addEventListener('click', e => {
  if(e.target===e.currentTarget) closeModal();
});

// ════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════
function renderAdmin() {
  const isAttendant = currentUser.role === 'attendant';
  const btnNew = document.getElementById('btn-new-user');
  if(btnNew) btnNew.style.display = isAttendant ? 'none' : 'flex';
  const total = allTickets.length;
  const open  = allTickets.filter(t=>t.status==='open').length;
  const prog  = allTickets.filter(t=>t.status==='progress').length;
  const done  = allTickets.filter(t=>t.status==='closed').length;
  const high  = allTickets.filter(t=>t.prio==='high').length;

  document.getElementById('s-total').textContent = total;
  document.getElementById('s-open').textContent  = open;
  document.getElementById('s-prog').textContent  = prog;
  document.getElementById('s-done').textContent  = done;
  document.getElementById('s-users').textContent = USERS.filter(u=>u.role==='user').length;
  document.getElementById('s-high').textContent  = high;

  const prioMap={low:'🟢 Baixa',med:'🟡 Média',high:'🔴 Alta'};
  const statMap={open:'Aberto',progress:'Em andamento',closed:'Resolvido'};

  document.getElementById('admin-tickets-body').innerHTML = allTickets.map(t=>`
    <tr>
      <td><span class="t-id">${t.id}</span></td>
      <td style="font-size:12px;color:var(--grey-400)">${t.name}</td>
      <td class="t-title">${t.title}</td>
      <td style="font-size:12px;color:var(--grey-400)">${t.cat}</td>
      <td><span class="priority-dot prio-${t.prio}">${prioMap[t.prio]}</span></td>
      <td><span class="status-badge status-${t.status}">${statMap[t.status]||t.status}</span></td>
      <td>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openModal('${t.id}')" title="Ver detalhes">🔍</button>
          ${!isAttendant ? `
          <button class="btn-icon" onclick="changeStatus('${t.id}','progress');renderAdmin()" title="Em andamento">⏳</button>
          <button class="btn-icon" onclick="changeStatus('${t.id}','closed');renderAdmin()" title="Resolver" style="color:var(--green)">✅</button>
          <button class="btn-icon btn-delete-ticket" onclick="deleteTicketInline('${t.id}')" title="Excluir">🗑️</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--grey-600);padding:36px;font-size:12px;font-family:'IBM Plex Mono',monospace">// NENHUM CHAMADO</td></tr>`;

  renderUsersList();
}

function deleteTicketInline(id) {
  if(!confirm('Excluir este chamado permanentemente?')) return;
  allTickets = allTickets.filter(x=>x.id!==id);
  renderAdmin();
}

function renderUsersList() {
  const canManage = currentUser.role === 'admin';
  document.getElementById('users-list').innerHTML = USERS.map(u => {
    const avatarHtml = u.photo
      ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`
      : `<span>${u.name.charAt(0)}</span>`;
    const isProtected = u.role === 'admin' && u.id === currentUser.id;
    let roleTag = '';
    if (u.role==='admin') roleTag = '<span class="role-tag admin">Admin</span>';
    else if (u.role==='attendant') roleTag = '<span class="role-tag attendant">Atendente</span>';
    else roleTag = '<span class="role-tag">User</span>';
    return `
      <div class="user-item">
        <div class="user-av" style="background:${u.color}22;color:${u.color};overflow:hidden">${avatarHtml}</div>
        <div class="user-info">
          <div class="user-name">${u.name} ${roleTag}</div>
          <div class="user-email">${u.email}${u.position ? ' · '+u.position : ''}</div>
        </div>
        <div class="user-actions">
          ${canManage ? `<button class="btn-icon" onclick="openUserModal(${u.id})">✏️ Editar</button>` : ''}
          ${canManage && !isProtected ? `<button class="btn-icon btn-delete-ticket" onclick="deleteUser(${u.id})">🗑️</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function changeRole(uid, role) {
  const u = USERS.find(x=>x.id===uid);
  if(u) u.role=role;
}

function openUserModal(userId) {
  if(currentUser.role === 'attendant') return; // attendants can't manage users
  editingUserId = userId || null;
  newUserPhotoBase64 = '';

  const modal = document.getElementById('user-modal-overlay');
  const title = document.getElementById('user-modal-title');

  if (userId) {
    const u = USERS.find(x=>x.id===userId);
    if(!u) return;
    title.textContent = '✏️ EDITAR USUÁRIO';
    document.getElementById('um-name').value     = u.name;
    document.getElementById('um-email').value    = u.email;
    document.getElementById('um-pass').value     = u.pass;
    document.getElementById('um-phone').value    = u.phone || '';
    document.getElementById('um-dept').value     = u.dept  || '';
    document.getElementById('um-position').value = u.position || '';
    document.getElementById('um-bio').value      = u.bio   || '';
    document.getElementById('um-role').value     = u.role;
    document.getElementById('um-color').value    = u.color || '#3B82F6';

    const prev = document.getElementById('um-photo-preview');
    if(u.photo) {
      prev.innerHTML = `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
      newUserPhotoBase64 = u.photo;
    } else {
      prev.innerHTML = `<span style="font-size:28px;opacity:.4">📷</span>`;
    }
    renderPermissionsList(u.permissions || DEFAULT_PERMISSIONS[u.role] || []);
  } else {
    title.textContent = '➕ NOVO USUÁRIO';
    ['um-name','um-email','um-pass','um-phone','um-dept','um-position','um-bio'].forEach(id=>{
      document.getElementById(id).value='';
    });
    document.getElementById('um-role').value  = 'user';
    document.getElementById('um-color').value = '#3B82F6';
    document.getElementById('um-photo-preview').innerHTML = `<span style="font-size:28px;opacity:.4">📷</span>`;
    renderPermissionsList(DEFAULT_PERMISSIONS.user);
  }

  modal.classList.add('open');
}

function renderPermissionsList(activePerms) {
  const list = document.getElementById('um-permissions-list');
  list.innerHTML = ALL_PERMISSIONS.map(p => `
    <label style="display:flex;align-items:flex-start;gap:8px;padding:7px 8px;border-radius:3px;cursor:pointer;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);transition:background .15s" title="${p.desc}">
      <input type="checkbox" id="perm-${p.id}" value="${p.id}" ${activePerms.includes(p.id)?'checked':''} style="margin-top:2px;accent-color:var(--accent);cursor:pointer">
      <div>
        <div style="font-size:11px;color:var(--white);font-family:'Space Grotesk',sans-serif">${p.label}</div>
        <div style="font-size:9px;color:var(--grey-600);font-family:'IBM Plex Mono',monospace;margin-top:1px">${p.desc}</div>
      </div>
    </label>
  `).join('');
}

function resetPermissionsToRole() {
  const role = document.getElementById('um-role').value;
  renderPermissionsList(DEFAULT_PERMISSIONS[role] || []);
}

// Ouvir mudança de perfil para sugerir reset de permissões
document.addEventListener('DOMContentLoaded', () => {
  const roleSelect = document.getElementById('um-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      resetPermissionsToRole();
    });
  }
});

function closeUserModal() {
  document.getElementById('user-modal-overlay').classList.remove('open');
  editingUserId = null;
  newUserPhotoBase64 = '';
}

document.getElementById('user-modal-overlay').addEventListener('click', e => {
  if(e.target===e.currentTarget) closeUserModal();
});

function handlePhotoUpload(input) {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024) { alert('Foto muito grande. Máximo: 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    newUserPhotoBase64 = e.target.result;
    document.getElementById('um-photo-preview').innerHTML =
      `<img src="${newUserPhotoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
  };
  reader.readAsDataURL(file);
}

function saveUser() {
  const name     = document.getElementById('um-name').value.trim();
  const email    = document.getElementById('um-email').value.trim();
  const pass     = document.getElementById('um-pass').value.trim();
  const phone    = document.getElementById('um-phone').value.trim();
  const dept     = document.getElementById('um-dept').value.trim();
  const position = document.getElementById('um-position').value.trim();
  const bio      = document.getElementById('um-bio').value.trim();
  const role     = document.getElementById('um-role').value;
  const color    = document.getElementById('um-color').value;

  // Coletar permissões selecionadas
  const permissions = ALL_PERMISSIONS
    .map(p => p.id)
    .filter(id => {
      const el = document.getElementById('perm-'+id);
      return el && el.checked;
    });

  if(!name || !email || !pass) {
    alert('Nome, e-mail e senha são obrigatórios.');
    return;
  }

  const duplicate = USERS.find(u => u.email === email && u.id !== editingUserId);
  if(duplicate) { alert('Este e-mail já está em uso.'); return; }

  if(editingUserId) {
    const u = USERS.find(x=>x.id===editingUserId);
    if(u) {
      u.name = name; u.email = email; u.pass = pass;
      u.phone = phone; u.dept = dept; u.position = position;
      u.bio = bio; u.role = role; u.color = color;
      u.permissions = permissions;
      if(newUserPhotoBase64) u.photo = newUserPhotoBase64;
      if(u.id === currentUser.id) { currentUser = u; updateNavbar(); }
    }
  } else {
    USERS.push({ id: userCounter++, name, email, pass, role, color, phone, dept, position, bio, photo: newUserPhotoBase64 || '', permissions });
  }

  closeUserModal();
  renderAdmin();
  showAdminToast(editingUserId ? '✅ Usuário atualizado com sucesso!' : '✅ Usuário criado com sucesso!');
}

function deleteUser(uid) {
  const u = USERS.find(x=>x.id===uid);
  if(!u) return;
  if(u.id === currentUser.id) { alert('Você não pode excluir sua própria conta.'); return; }
  if(!confirm(`Excluir o usuário "${u.name}"? Os chamados deste usuário serão mantidos.`)) return;
  USERS = USERS.filter(x=>x.id!==uid);
  renderAdmin();
  showAdminToast('🗑️ Usuário excluído.');
}

function showAdminToast(msg) {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3500);
}

// ════════════════════════════════════════
// RELATÓRIOS (admin)
// ════════════════════════════════════════
function renderReports() {
  const today = new Date().toISOString().split('T')[0];
  const todayFmt = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('report-today-date').textContent = todayFmt;

  const todayTickets = allTickets.filter(t => t.date === today);
  const total  = allTickets.length;
  const open   = allTickets.filter(t=>t.status==='open').length;
  const prog   = allTickets.filter(t=>t.status==='progress').length;
  const done   = allTickets.filter(t=>t.status==='closed').length;
  const high   = allTickets.filter(t=>t.prio==='high').length;
  const rate   = total > 0 ? Math.round((done/total)*100) : 0;

  document.getElementById('rk-today').textContent    = todayTickets.length;
  document.getElementById('rk-today-sub').textContent= `de ${total} no total`;
  document.getElementById('rk-open').textContent     = open;
  document.getElementById('rk-prog').textContent     = prog;
  document.getElementById('rk-done').textContent     = done;
  document.getElementById('rk-high').textContent     = high;
  document.getElementById('rk-rate').textContent     = rate+'%';

  drawStatusChart();
  drawPriorityChart();
  drawCategoryChart();
  drawDeptChart();
  drawTimelineChart();
}

// ─── Gráfico de barras: Status ───────────
function drawStatusChart() {
  const open   = allTickets.filter(t=>t.status==='open').length;
  const prog   = allTickets.filter(t=>t.status==='progress').length;
  const done   = allTickets.filter(t=>t.status==='closed').length;
  const max    = Math.max(open, prog, done, 1);
  const W=500, H=180, pad=50, barW=80, gap=60;

  const bars = [
    {label:'Abertos',   val:open, color:'#0057FF'},
    {label:'Andamento', val:prog, color:'#FFD600'},
    {label:'Resolvidos',val:done, color:'#00C853'},
  ];

  const totalBarsW = bars.length * barW + (bars.length-1) * gap;
  const startX = (W - totalBarsW) / 2;

  let svg = `<svg viewBox="0 0 ${W} ${H+60}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px">`;
  // grid lines
  [0,25,50,75,100].forEach(pct => {
    const y = pad + (H - pad) * (1 - pct/100);
    svg += `<line x1="${pad}" y1="${y}" x2="${W-10}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    const val = Math.round(max * pct / 100);
    svg += `<text x="${pad-8}" y="${y+4}" text-anchor="end" fill="#555550" font-size="10" font-family="IBM Plex Mono,monospace">${val}</text>`;
  });

  bars.forEach((b, i) => {
    const x = startX + i * (barW + gap);
    const barH = max > 0 ? ((b.val / max) * (H - pad)) : 0;
    const y = pad + (H - pad) - barH;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${b.color}" opacity="0.85"/>`;
    svg += `<text x="${x + barW/2}" y="${y - 8}" text-anchor="middle" fill="${b.color}" font-size="16" font-weight="bold" font-family="Bebas Neue,sans-serif">${b.val}</text>`;
    svg += `<text x="${x + barW/2}" y="${H+pad+2}" text-anchor="middle" fill="#9A9A94" font-size="11" font-family="Space Grotesk,sans-serif">${b.label}</text>`;
  });
  // axis
  svg += `<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
  svg += `<line x1="${pad}" y1="${H}" x2="${W-10}" y2="${H}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
  svg += `</svg>`;
  document.getElementById('chart-status').innerHTML = svg;
}

// ─── Gráfico de pizza: Prioridade ────────
function drawPriorityChart() {
  const low  = allTickets.filter(t=>t.prio==='low').length;
  const med  = allTickets.filter(t=>t.prio==='med').length;
  const high = allTickets.filter(t=>t.prio==='high').length;
  const total = low + med + high || 1;

  const data = [
    {label:'Baixa', val:low,  color:'#00C853'},
    {label:'Média', val:med,  color:'#FFD600'},
    {label:'Alta',  val:high, color:'#FF3B00'},
  ];

  const cx=110, cy=110, r=90, r2=52;
  let svg = `<svg viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px">`;

  let startAngle = -Math.PI/2;
  data.forEach(d => {
    const angle = (d.val / total) * 2 * Math.PI;
    if(angle === 0) return;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + r2 * Math.cos(startAngle);
    const yi1 = cy + r2 * Math.sin(startAngle);
    const xi2 = cx + r2 * Math.cos(endAngle);
    const yi2 = cy + r2 * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    svg += `<path d="M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${r2},${r2} 0 ${large},0 ${xi1},${yi1} Z" fill="${d.color}" opacity="0.85"/>`;
    startAngle = endAngle;
  });

  // Centro
  svg += `<text x="${cx}" y="${cy-8}" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="Bebas Neue,sans-serif">${total}</text>`;
  svg += `<text x="${cx}" y="${cy+10}" text-anchor="middle" fill="#555550" font-size="10" font-family="IBM Plex Mono,monospace">TOTAL</text>`;

  // Legenda
  let ly = 30;
  data.forEach(d => {
    const pct = total > 0 ? Math.round((d.val/total)*100) : 0;
    svg += `<rect x="235" y="${ly}" width="12" height="12" rx="2" fill="${d.color}"/>`;
    svg += `<text x="253" y="${ly+10}" fill="#9A9A94" font-size="12" font-family="Space Grotesk,sans-serif">${d.label}</text>`;
    svg += `<text x="320" y="${ly+10}" text-anchor="end" fill="white" font-size="13" font-weight="bold" font-family="Bebas Neue,sans-serif">${d.val} <tspan fill="#555550" font-size="10">(${pct}%)</tspan></text>`;
    ly += 30;
  });
  svg += `</svg>`;
  document.getElementById('chart-priority').innerHTML = svg;
}

// ─── Gráfico de barras: Categoria ────────
function drawCategoryChart() {
  const cats = {};
  allTickets.forEach(t => { cats[t.cat] = (cats[t.cat]||0)+1; });
  const entries = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  if(!entries.length) { document.getElementById('chart-category').innerHTML='<p style="color:#555;text-align:center;padding:20px;font-size:12px">Sem dados</p>'; return; }
  const max = entries[0][1];
  const colors = ['#FF3B00','#0057FF','#00C853','#FFD600','#FF6B6B','#7C3AED','#06B6D4','#F59E0B'];

  const W=680, barH=28, gap=10, padL=130, padR=80, padT=20;
  const H = entries.length * (barH + gap) + padT;

  let svg = `<svg viewBox="0 0 ${W} ${H+20}" xmlns="http://www.w3.org/2000/svg" style="width:100%">`;
  entries.forEach(([cat, val], i) => {
    const y = padT + i * (barH + gap);
    const bw = max > 0 ? ((val/max) * (W - padL - padR)) : 0;
    const col = colors[i % colors.length];
    svg += `<text x="${padL-10}" y="${y+barH/2+5}" text-anchor="end" fill="#9A9A94" font-size="12" font-family="Space Grotesk,sans-serif">${cat}</text>`;
    svg += `<rect x="${padL}" y="${y}" width="${bw}" height="${barH}" rx="2" fill="${col}" opacity="0.8"/>`;
    svg += `<text x="${padL+bw+8}" y="${y+barH/2+5}" fill="${col}" font-size="14" font-weight="bold" font-family="Bebas Neue,sans-serif">${val}</text>`;
  });
  svg += `</svg>`;
  document.getElementById('chart-category').innerHTML = svg;
}

// ─── Gráfico barras horizontais: Dept ────
function drawDeptChart() {
  const depts = {};
  allTickets.forEach(t => { depts[t.dept] = (depts[t.dept]||0)+1; });
  const entries = Object.entries(depts).sort((a,b)=>b[1]-a[1]);
  if(!entries.length) { document.getElementById('chart-dept').innerHTML='<p style="color:#555;text-align:center;padding:20px;font-size:12px">Sem dados</p>'; return; }
  const max = entries[0][1];
  const colors = ['#FF3B00','#0057FF','#00C853','#FFD600','#7C3AED','#06B6D4'];

  const W=320, barH=26, gap=10, padL=110, padR=50, padT=16;
  const H = entries.length * (barH + gap) + padT;

  let svg = `<svg viewBox="0 0 ${W} ${H+10}" xmlns="http://www.w3.org/2000/svg" style="width:100%">`;
  entries.forEach(([dept, val], i) => {
    const y = padT + i * (barH + gap);
    const bw = max > 0 ? ((val/max) * (W - padL - padR)) : 0;
    const col = colors[i % colors.length];
    svg += `<text x="${padL-8}" y="${y+barH/2+4}" text-anchor="end" fill="#9A9A94" font-size="11" font-family="Space Grotesk,sans-serif">${dept}</text>`;
    svg += `<rect x="${padL}" y="${y}" width="${bw}" height="${barH}" rx="2" fill="${col}" opacity="0.8"/>`;
    svg += `<text x="${padL+bw+7}" y="${y+barH/2+4}" fill="${col}" font-size="13" font-weight="bold" font-family="Bebas Neue,sans-serif">${val}</text>`;
  });
  svg += `</svg>`;
  document.getElementById('chart-dept').innerHTML = svg;
}

// ─── Gráfico de linha: últimos 7 dias ────
function drawTimelineChart() {
  const days = [];
  for(let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().split('T')[0]);
  }
  const counts = days.map(d => allTickets.filter(t=>t.date===d).length);
  const max = Math.max(...counts, 1);
  const W=320, H=140, padL=30, padR=20, padT=20, padB=30;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const pts = counts.map((c,i)=>({
    x: padL + (i/(days.length-1))*cW,
    y: padT + cH - (c/max)*cH
  }));

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%">`;

  // Grid horizontais
  [0,max/2,max].forEach(v => {
    const y = padT + cH - (v/max)*cH;
    svg += `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    svg += `<text x="${padL-4}" y="${y+4}" text-anchor="end" fill="#555550" font-size="9" font-family="IBM Plex Mono,monospace">${Math.round(v)}</text>`;
  });

  // Área preenchida
  const areaPath = `M${pts[0].x},${padT+cH} ` +
    pts.map(p=>`L${p.x},${p.y}`).join(' ') +
    ` L${pts[pts.length-1].x},${padT+cH} Z`;
  svg += `<path d="${areaPath}" fill="url(#tlGrad)" opacity="0.3"/>`;
  svg += `<defs><linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FF3B00"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>`;

  // Linha
  const linePath = pts.map((p,i)=>(i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`)).join(' ');
  svg += `<path d="${linePath}" fill="none" stroke="#FF3B00" stroke-width="2" stroke-linejoin="round"/>`;

  // Pontos e labels de dia
  pts.forEach((p,i) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#FF3B00"/>`;
    if(counts[i]>0) svg += `<text x="${p.x}" y="${p.y-8}" text-anchor="middle" fill="#FF3B00" font-size="10" font-weight="bold" font-family="Bebas Neue,sans-serif">${counts[i]}</text>`;
    const d = new Date(days[i]+'T12:00:00');
    const label = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
    svg += `<text x="${p.x}" y="${H-4}" text-anchor="middle" fill="#555550" font-size="9" font-family="IBM Plex Mono,monospace">${label}</text>`;
  });

  svg += `</svg>`;
  document.getElementById('chart-timeline').innerHTML = svg;
}

// ════════════════════════════════════════
// SUPORTE IA (apenas users)
// ════════════════════════════════════════
function renderAiStats() {
  const myTickets = allTickets.filter(t=>t.userId===currentUser.id);
  document.getElementById('ai-stats').innerHTML = `
    <div class="ai-stat"><div class="ai-stat-num">${myTickets.length}</div><div class="ai-stat-label">Total</div></div>
    <div class="ai-stat"><div class="ai-stat-num" style="color:var(--blue)">${myTickets.filter(t=>t.status==='open').length}</div><div class="ai-stat-label">Abertos</div></div>
    <div class="ai-stat"><div class="ai-stat-num" style="color:var(--green)">${myTickets.filter(t=>t.status==='closed').length}</div><div class="ai-stat-label">Resolvidos</div></div>
    <div class="ai-stat"><div class="ai-stat-num" style="color:var(--yellow)">${myTickets.filter(t=>t.status==='progress').length}</div><div class="ai-stat-label">Andamento</div></div>
  `;
}

function quickAsk(q) {
  document.getElementById('ai-input').value = q;
  sendAI();
}

function addMsg(role, text) {
  const box = document.getElementById('ai-messages');
  const now = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const el  = document.createElement('div');
  el.className = 'msg '+role;
  el.innerHTML = role==='ai'
    ? `<span class="msg-sender">🦊 Fox IA</span><div class="msg-bubble">${text}</div><span class="msg-time">${now}</span>`
    : `<div class="msg-bubble">${text}</div><span class="msg-time">${now}</span>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById('ai-messages');
  const el  = document.createElement('div');
  el.className='msg ai'; el.id='typing-indicator';
  el.innerHTML=`<span class="msg-sender">🦊 Fox IA</span><div class="msg-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  box.appendChild(el);
  box.scrollTop=box.scrollHeight;
}
function hideTyping() {
  const el=document.getElementById('typing-indicator');
  if(el) el.remove();
}

// ── Base de conhecimento da IA simulada ──────────────────────────────
const AI_KNOWLEDGE = [
  {
    keys: ['senha','password','login','acesso','entrar','autenticação','credencial'],
    answers: [
      `Olá, ${'{name}'}! 🔐 Problemas com senha são muito comuns. Veja o que você pode tentar:\n\n1. Certifique-se de que o Caps Lock está desativado.\n2. Tente a opção <strong>"Esqueci minha senha"</strong> na tela de login.\n3. Verifique se não há espaços acidentais no campo de senha.\n4. Se for conta corporativa, o administrador pode redefinir sua senha.\n\nSe o problema persistir, recomendo abrir um chamado para que nossa equipe possa resetar suas credenciais com segurança. ✅`,
      `Entendido, ${'{name}'}! 🔑 Para problemas de autenticação:\n\n• Verifique se está usando o e-mail correto (formato: usuario@empresa.com)\n• Tente limpar o cache do navegador (Ctrl+Shift+Del)\n• Aguarde 15 minutos se a conta foi bloqueada por excesso de tentativas\n\nPrecisando de redefinição manual, é só abrir um chamado com prioridade <strong>Alta</strong>.`
    ]
  },
  {
    keys: ['computador','pc','não liga','travado','lento','inicializa','boot','reiniciar','reinicia'],
    answers: [
      `Vou te ajudar com isso, ${'{name}'}! 💻 Siga estes passos:\n\n<strong>1. Reinicialização forçada:</strong> Segure o botão de energia por 10 segundos até desligar, aguarde 30s e ligue novamente.\n\n<strong>2. Se travar no boot:</strong> Tente iniciar em <em>Modo Seguro</em> — pressione F8 repetidamente ao ligar.\n\n<strong>3. Computador lento?</strong> Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc) e verifique se há processos consumindo muita CPU ou memória.\n\nSe nada funcionar, abra um chamado com categoria <strong>Hardware</strong> para atendimento presencial. 🔧`,
      `Olá! 🖥️ Para problemas de inicialização, tente:\n\n• Desconectar todos os periféricos USB e reiniciar\n• Verificar se os cabos de energia estão bem conectados\n• Aguardar 2 minutos após desligar antes de ligar novamente (descarga capacitiva)\n\nSe o problema for recorrente, pode indicar falha no HD ou na memória RAM. Recomendo abrir um chamado de <strong>Hardware com prioridade Alta</strong>. 🚨`
    ]
  },
  {
    keys: ['impressora','imprimir','print','papel','toner','cartucho'],
    answers: [
      `${'{name}'}, problemas com impressora são chatos mas têm solução! 🖨️\n\n<strong>Passos rápidos:</strong>\n1. Verifique se a impressora está ligada e com papel\n2. Cancele todos os trabalhos pendentes na fila de impressão\n3. Desconecte o cabo USB (ou reconecte ao Wi-Fi) e aguarde 30s\n4. Reinicie o spooler: Serviços → Spooler de Impressão → Reiniciar\n\nSe aparecer erro de "driver", pode ser necessário reinstalar. Quer que eu abra um chamado para suporte técnico? 🛠️`
    ]
  },
  {
    keys: ['internet','rede','wifi','wi-fi','conexão','sem conexão','cabo','vpn','lenta'],
    answers: [
      `Sem internet, tudo para! 🌐 Vamos resolver, ${'{name}'}:\n\n<strong>Diagnóstico rápido:</strong>\n• Reinicie o roteador: desligue por 30 segundos\n• No Windows: execute <code>ipconfig /release</code> e <code>ipconfig /renew</code> no CMD\n• Verifique se outros dispositivos também estão sem conexão\n\n<strong>Se for só seu PC:</strong>\n• Clique com botão direito no ícone de rede → Solucionar problemas\n• Verifique se a placa de rede está ativa no Gerenciador de Dispositivos\n\nProblema persistindo? Abra um chamado na categoria <strong>Redes</strong>. 📡`,
      `Entendi! Para conexão VPN ou rede corporativa:\n\n1. Verifique se suas credenciais de VPN estão atualizadas\n2. Tente se conectar em outra rede Wi-Fi para testar\n3. Desative temporariamente o antivírus para checar se está bloqueando\n4. Reinicie o serviço de VPN pelo painel de configurações\n\nSe o problema for de infraestrutura (vários usuários afetados), prioridade deve ser <strong>Alta</strong>! 🚨`
    ]
  },
  {
    keys: ['email','e-mail','outlook','correio','mensagem','caixa','spam','não recebo','não envia'],
    answers: [
      `${'{name}'}, vamos resolver o e-mail! 📧\n\n<strong>Verificações básicas:</strong>\n1. Cheque a pasta <em>Spam/Lixo eletrônico</em>\n2. Verifique se sua caixa de entrada não está cheia (limite de armazenamento)\n3. No Outlook: Arquivo → Configurações de Conta → Testar configurações\n\n<strong>Não consegue enviar?</strong>\n• Verifique a pasta <em>Itens enviados</em> e <em>Rascunhos</em>\n• Certifique-se que o antivírus não está bloqueando o Outlook\n• Tente webmail como alternativa: acesse pelo navegador\n\nPersistindo, abro um chamado com categoria <strong>E-mail</strong> para você! ✉️`
    ]
  },
  {
    keys: ['antivírus','vírus','malware','hackeado','suspeito','phishing','ransomware','infectado'],
    answers: [
      `⚠️ ATENÇÃO, ${'{name}'}! Isso é urgente:\n\n<strong>Faça AGORA:</strong>\n1. <strong>Desconecte o PC da rede</strong> (cabo e Wi-Fi) para evitar propagação\n2. NÃO abra mais nenhum arquivo suspeito\n3. NÃO insira pen drives ou HDs externos\n4. Anote o que aconteceu (mensagens de erro, arquivos afetados)\n\n<strong>Abra um chamado IMEDIATAMENTE</strong> com prioridade <strong>🔴 ALTA</strong> na categoria <em>Segurança</em>. Nossa equipe precisa agir rápido!\n\nEm caso de ransomware, não pague nenhum resgate antes de falar conosco. 🔐`
    ]
  },
  {
    keys: ['software','programa','instalar','instalação','atualizar','update','licença','office','windows'],
    answers: [
      `Olá, ${'{name}'}! 💿 Para instalações e atualizações:\n\n• Instalações de software devem ser <strong>aprovadas pelo TI</strong> antes de prosseguir\n• Para atualizar o Windows: Configurações → Windows Update → Verificar atualizações\n• Licenças de software corporativo são gerenciadas pelo setor de TI\n\nSe precisar de instalação ou licença, abra um chamado em <strong>Software</strong> com sua justificativa. Nossa equipe processa em até 24h! 📋`,
      `${'{name}'}, sobre softwares e programas:\n\n<strong>Antes de instalar qualquer coisa:</strong>\n✅ Verifique se é software aprovado pela empresa\n✅ Baixe apenas de fontes oficiais\n✅ Em caso de dúvida, abra um chamado!\n\nPara o <strong>Office/Microsoft 365</strong>: acesse office.com com sua conta corporativa para ativar. Problemas de ativação? Chamado com prioridade Média na categoria Software. 📎`
    ]
  },
  {
    keys: ['chamado','abrir','registrar','suporte','ticket','problema','ajuda','urgente','erro'],
    answers: [
      `Claro, ${'{name}'}! Para abrir um chamado, clique em <strong>"Abrir Chamado"</strong> no menu lateral. 📋\n\nDicas para um bom chamado:\n• Seja detalhado na descrição do problema\n• Escolha a <strong>prioridade correta</strong>:\n  - 🟢 Baixa: não impede o trabalho\n  - 🟡 Média: dificulta mas tem contorno\n  - 🔴 Alta: impede completamente o trabalho\n\nCom essas informações, nossa equipe resolve muito mais rápido! ⚡`
    ]
  },
  {
    keys: ['monitor','tela','display','resolução','brilho','segunda tela','hdmi','vga','preto','piscando'],
    answers: [
      `${'{name}'}, problemas de monitor! 🖥️\n\n<strong>Tela preta ou sem sinal:</strong>\n1. Verifique o cabo HDMI/VGA — remova e reconecte\n2. Tente outro cabo ou outra entrada do monitor\n3. Reinicie o PC com o monitor conectado\n\n<strong>Resolução errada:</strong>\nBotão direito na área de trabalho → Configurações de Exibição → Resolução Recomendada\n\n<strong>Segunda tela não detectada:</strong>\nWindows+P → Estender → se não aparecer, clique em "Detectar"\n\nProblema no hardware físico? Abra um chamado em <strong>Hardware</strong>! 🔧`
    ]
  },
  {
    keys: ['backup','arquivo','perdido','recuperar','deletei','apaguei','pasta','documento','salvei'],
    answers: [
      `Não entre em pânico, ${'{name}'}! 💾 Vamos tentar recuperar:\n\n<strong>Passos imediatos:</strong>\n1. Verifique a <strong>Lixeira</strong> do Windows — arquivos deletados ficam lá\n2. Se excluiu com Shift+Del: procure no <em>histórico de versões</em> da pasta\n3. Clique com botão direito na pasta → Restaurar versões anteriores\n\n<strong>Para arquivos corporativos:</strong>\n• Verifique se havia backup automático ativo\n• Contate o TI — podemos recuperar de backups do servidor\n\n⚠️ Não salve novos arquivos no local até recuperar — isso pode sobrescrever os dados! Abra um chamado urgente! 🆘`
    ]
  }
];

const AI_FALLBACK = [
  `Olá, ${'{name}'}! 🦊 Recebi sua mensagem. Esse é um tema que pode precisar de análise mais detalhada pela nossa equipe técnica.\n\nEnquanto isso, algumas ações gerais que costumam ajudar:\n• Reinicie o equipamento ou aplicativo\n• Verifique se há atualizações pendentes\n• Tente reproduzir o problema e anote os passos\n\nSe o problema persistir, recomendo <strong>abrir um chamado</strong> com uma descrição detalhada. Nossa equipe retornará em breve! ⚡`,
  `Entendido, ${'{name}'}! 🤖 Analisei sua solicitação.\n\nPara garantir o melhor atendimento:\n1. Documente o erro (print da tela, se possível)\n2. Anote quando o problema começou\n3. Liste o que já tentou fazer\n\nCom essas informações, abra um chamado e nossa equipe priorizará seu atendimento. Posso ajudar com mais alguma coisa? 😊`,
  `Boa pergunta, ${'{name}'}! 🦊 Para problemas técnicos que não se encaixam nos padrões comuns, o melhor caminho é envolver a equipe de TI diretamente.\n\nRecomendo abrir um chamado descrevendo:\n• O que estava fazendo quando o problema ocorreu\n• Mensagens de erro que apareceram\n• Se outros colegas têm o mesmo problema\n\nCom isso, conseguimos diagnosticar e resolver muito mais rápido! 🛠️`
];

function getAIResponse(question) {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const name = currentUser.name.split(' ')[0];

  for (const item of AI_KNOWLEDGE) {
    const match = item.keys.some(k => q.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if (match) {
      const answer = item.answers[Math.floor(Math.random() * item.answers.length)];
      return answer.replace(/\{name\}/g, name);
    }
  }

  const fallback = AI_FALLBACK[Math.floor(Math.random() * AI_FALLBACK.length)];
  return fallback.replace(/\{name\}/g, name);
}

async function sendAI() {
  if(currentUser.role==='admin' || currentUser.role==='attendant') return;
  const inp=document.getElementById('ai-input');
  const q=inp.value.trim();
  if(!q) return;
  inp.value='';
  addMsg('user',q);
  showTyping();

  // Simula tempo de resposta realista (1.2s a 2.8s)
  const delay = 1200 + Math.random() * 1600;
  await new Promise(resolve => setTimeout(resolve, delay));

  hideTyping();
  const reply = getAIResponse(q);
  addMsg('ai', reply.replace(/\n/g,'<br>'));
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function formatDate(d) {
  const [y,m,day]=d.split('-');
  return `${day}/${m}/${y}`;
}

// ════════════════════════════════════════
// PAINEL ATENDENTE
// ════════════════════════════════════════
const DEPARTMENTS = ['TI','Financeiro','RH','Comercial','Operacional','Suporte Hardware','Redes','Outros'];

function renderAttendantPanel() {
  const open   = allTickets.filter(t=>t.status==='open').length;
  const prog   = allTickets.filter(t=>t.status==='progress').length;
  const done   = allTickets.filter(t=>t.status==='closed').length;
  const fwd    = allTickets.filter(t=>t.forwarded).length;

  document.getElementById('at-open').textContent  = open;
  document.getElementById('at-prog').textContent  = prog;
  document.getElementById('at-done').textContent  = done;
  document.getElementById('at-fwd').textContent   = fwd;

  const prioMap={low:'🟢 Baixa',med:'🟡 Média',high:'🔴 Alta'};
  const statMap={open:'Aberto',progress:'Em atendimento',closed:'Resolvido'};

  // Pending queue (open tickets, sorted by priority)
  const prioOrder={high:0,med:1,low:2};
  const pending = allTickets
    .filter(t=>t.status==='open'||t.status==='progress')
    .sort((a,b)=>prioOrder[a.prio]-prioOrder[b.prio]);

  document.getElementById('at-queue-body').innerHTML = pending.map(t=>`
    <tr>
      <td><span class="t-id">${t.id}</span></td>
      <td style="font-size:12px;color:var(--grey-400)">${t.name}</td>
      <td class="t-title">${t.title}${t.forwarded?` <span class="fwd-tag">📤 ${t.forwardedTo}</span>`:''}</td>
      <td style="font-size:12px;color:var(--grey-400)">${t.cat}</td>
      <td><span class="priority-dot prio-${t.prio}">${prioMap[t.prio]}</span></td>
      <td><span class="status-badge status-${t.status}">${statMap[t.status]||t.status}</span></td>
      <td>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openModal('${t.id}')" title="Atender">🔍 Atender</button>
          <button class="btn-icon btn-forward" onclick="openForwardModal('${t.id}')" title="Encaminhar">📤</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--grey-600);padding:36px;font-size:12px;font-family:'IBM Plex Mono',monospace">// NENHUM CHAMADO PENDENTE 🎉</td></tr>`;

  // Recent resolved
  const recent = allTickets.filter(t=>t.status==='closed').slice(0,5);
  document.getElementById('at-recent-body').innerHTML = recent.map(t=>`
    <tr>
      <td><span class="t-id">${t.id}</span></td>
      <td class="t-title">${t.title}</td>
      <td style="font-size:12px;color:var(--grey-400)">${t.name}</td>
      <td>${t.forwarded?`<span class="fwd-tag">📤 ${t.forwardedTo}</span>`:'<span style="color:var(--green);font-size:11px">✅ Interno</span>'}</td>
      <td style="color:var(--grey-400);font-size:12px;font-family:\'IBM Plex Mono\',monospace">${formatDate(t.date)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--grey-600);padding:24px;font-size:12px">Nenhum chamado resolvido ainda.</td></tr>`;
}

// ── Forward Modal ──────────────────────
let forwardingTicketId = null;

function openForwardModal(ticketId) {
  forwardingTicketId = ticketId;
  const t = allTickets.find(x=>x.id===ticketId);
  if(!t) return;
  document.getElementById('fwd-ticket-ref').textContent = t.id+' — '+t.title;
  document.getElementById('fwd-dept').value = '';
  document.getElementById('fwd-reason').value = '';
  // Fecha o modal de detalhe antes de abrir o de encaminhamento
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('forward-modal-overlay').classList.add('open');
}

function closeForwardModal() {
  document.getElementById('forward-modal-overlay').classList.remove('open');
  forwardingTicketId = null;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('forward-modal-overlay').addEventListener('click', e => {
    if(e.target===e.currentTarget) closeForwardModal();
  });
});

function confirmForward() {
  const dept   = document.getElementById('fwd-dept').value;
  const reason = document.getElementById('fwd-reason').value.trim();
  if(!dept) { alert('Selecione o departamento de destino.'); return; }
  if(!reason) { alert('Informe o motivo do encaminhamento.'); return; }

  const t = allTickets.find(x=>x.id===forwardingTicketId);
  if(t) {
    t.forwarded    = true;
    t.forwardedTo  = dept;
    t.forwardReason= reason;
    t.status       = 'progress';
  }

  closeForwardModal();
  closeModal();
  showAdminToast(`📤 Chamado encaminhado para ${dept}!`);
  renderAttendantPanel();
  renderTickets();
}

// ════════════════════════════════════════
// CHAT DE CHAMADO
// ════════════════════════════════════════
let CHATS = {}; // { ticketId: [ {id, senderId, senderName, senderRole, senderColor, text, ts, read} ] }
let currentChatTicketId = null;

function openChatModal(ticketId) {
  const t = allTickets.find(x => x.id === ticketId);
  if (!t) return;
  currentChatTicketId = ticketId;

  // Fecha o modal de detalhe do chamado
  document.getElementById('modal-overlay').classList.remove('open');

  // Inicializa histórico se não existir
  if (!CHATS[ticketId]) CHATS[ticketId] = [];

  // Marca mensagens como lidas para o usuário atual
  CHATS[ticketId].forEach(m => {
    if (m.senderId !== currentUser.id) m.read = true;
  });

  // Header
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'attendant';
  document.getElementById('chat-modal-title').textContent = `💬 Chat — ${t.id}`;
  document.getElementById('chat-modal-sub').innerHTML = isStaff
    ? `<span class="chat-ticket-ref">${t.title}</span> · <span style="color:var(--grey-400)">com ${t.name}</span>`
    : `<span class="chat-ticket-ref">${t.title}</span> · <span style="color:var(--grey-400)">Suporte Fox Smart</span>`;

  // Mostrar botão de finalizar chat somente para staff e se chat não está encerrado
  const endBtn = document.getElementById('btn-end-chat');
  const canClose = isStaff && hasPermission('close_tickets') && t.status !== 'chatClosed';
  endBtn.style.display = canClose ? 'flex' : 'none';

  // Bloquear input se chat encerrado
  const inputBar = document.querySelector('.chat-input-bar');
  if (t.chatClosed) {
    inputBar.style.display = 'none';
    document.getElementById('chat-modal-sub').innerHTML += ' · <span style="color:#FF4747;font-size:11px">🔴 Chat encerrado</span>';
  } else {
    inputBar.style.display = 'flex';
  }

  renderChatMessages();
  document.getElementById('chat-modal-overlay').classList.add('open');
  if (!t.chatClosed) setTimeout(() => document.getElementById('chat-input').focus(), 80);
}

function closeChatModal() {
  document.getElementById('chat-modal-overlay').classList.remove('open');
  currentChatTicketId = null;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeChatModal();
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('chat-modal-overlay').classList.contains('open')) {
    closeChatModal();
  }
});

function renderChatMessages() {
  const msgs = CHATS[currentChatTicketId] || [];
  const body = document.getElementById('chat-body');

  if (msgs.length === 0) {
    body.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-title">Nenhuma mensagem ainda</div>
        <div class="chat-empty-sub">Inicie a conversa sobre este chamado.</div>
      </div>`;
    return;
  }

  let html = '';
  let lastDate = '';

  msgs.forEach(m => {
    const msgDate = new Date(m.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (msgDate !== lastDate) {
      html += `<div class="chat-date-divider"><span>${msgDate}</span></div>`;
      lastDate = msgDate;
    }

    if (m.isSystem) {
      html += `<div class="chat-system-msg">${escapeHtml(m.text).replace(/\n/g,'<br>')}</div>`;
      return;
    }

    const isMine = m.senderId === currentUser.id;
    const time = new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const roleLabel = m.senderRole === 'admin' ? 'Admin' : m.senderRole === 'attendant' ? 'Atendente' : 'Usuário';
    const initial = m.senderName.charAt(0);

    html += `
      <div class="chat-msg-row ${isMine ? 'mine' : 'theirs'}">
        ${!isMine ? `<div class="chat-avatar" style="background:${m.senderColor}22;color:${m.senderColor}">${initial}</div>` : ''}
        <div class="chat-bubble-wrap">
          ${!isMine ? `<div class="chat-sender-name">${m.senderName} <span class="chat-role-tag">${roleLabel}</span></div>` : ''}
          <div class="chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}">
            ${escapeHtml(m.text).replace(/\n/g,'<br>')}
          </div>
          <div class="chat-time ${isMine ? 'time-mine' : ''}">${time}${isMine ? (m.read ? ' · <span class="chat-read">Lido ✓✓</span>' : ' · <span class="chat-sent">Enviado ✓</span>') : ''}</div>
        </div>
        ${isMine ? `<div class="chat-avatar chat-avatar-mine" style="background:${currentUser.color}22;color:${currentUser.color}">${currentUser.name.charAt(0)}</div>` : ''}
      </div>`;
  });

  body.innerHTML = html;
  body.scrollTop = body.scrollHeight;
}

function sendChatMessage() {
  const inp = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text || !currentChatTicketId) return;

  if (!CHATS[currentChatTicketId]) CHATS[currentChatTicketId] = [];

  const msg = {
    id: Date.now(),
    senderId:   currentUser.id,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    senderColor: currentUser.color || '#3B82F6',
    text,
    ts:   new Date().toISOString(),
    read: false,
  };
  CHATS[currentChatTicketId].push(msg);

  inp.value = '';
  inp.style.height = 'auto';
  renderChatMessages();

  // Simula resposta automática se staff está falando e não há outro staff online
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'attendant';
  const t = allTickets.find(x => x.id === currentChatTicketId);
  if (!isStaff && t) {
    // Usuário mandou mensagem — mostra indicador de digitação e responde
    setTimeout(() => {
      const body = document.getElementById('chat-body');
      if (!body) return;
      const typing = document.createElement('div');
      typing.className = 'chat-msg-row theirs';
      typing.id = 'chat-typing';
      typing.innerHTML = `
        <div class="chat-avatar" style="background:#FF3B0022;color:#FF3B00">S</div>
        <div class="chat-bubble-wrap">
          <div class="chat-sender-name">Suporte Fox Smart <span class="chat-role-tag">Admin</span></div>
          <div class="chat-bubble bubble-theirs chat-typing-bubble">
            <span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>
          </div>
        </div>`;
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      setTimeout(() => {
        const el = document.getElementById('chat-typing');
        if (el) el.remove();
        const staffUser = USERS.find(u => u.role === 'admin');
        const auto = {
          id: Date.now(),
          senderId:    staffUser ? staffUser.id : 0,
          senderName:  staffUser ? staffUser.name : 'Suporte',
          senderRole:  'admin',
          senderColor: staffUser ? staffUser.color : '#FF3B00',
          text: `Olá! Recebemos sua mensagem sobre o chamado ${t.id}. Nossa equipe irá analisá-la em breve. Se preferir, aguarde o contato de um atendente.`,
          ts:   new Date().toISOString(),
          read: false,
        };
        if (CHATS[currentChatTicketId] && document.getElementById('chat-modal-overlay').classList.contains('open')) {
          CHATS[currentChatTicketId].push(auto);
          renderChatMessages();
        }
      }, 2200);
    }, 800);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════
// PERMISSÕES
// ════════════════════════════════════════
function hasPermission(permId) {
  if (!currentUser) return false;
  return (currentUser.permissions || []).includes(permId);
}

// ════════════════════════════════════════
// FINALIZAR CHAT / PROTOCOLO
// ════════════════════════════════════════
function openEndChatModal() {
  const t = allTickets.find(x => x.id === currentChatTicketId);
  if (!t) return;
  document.getElementById('end-chat-ref').textContent = t.id + ' — ' + t.title;
  document.getElementById('end-chat-summary').value = '';
  document.getElementById('end-chat-modal-overlay').classList.add('open');
}

function closeEndChatModal() {
  document.getElementById('end-chat-modal-overlay').classList.remove('open');
}

function confirmEndChat() {
  const t = allTickets.find(x => x.id === currentChatTicketId);
  if (!t) return;
  const summary = document.getElementById('end-chat-summary').value.trim();

  // Gerar protocolo
  const now = new Date();
  const protocolId = 'PROT-' + now.getFullYear().toString().slice(2)
    + String(now.getMonth()+1).padStart(2,'0')
    + String(now.getDate()).padStart(2,'0')
    + '-' + String(PROTOCOLS.length + 1).padStart(4,'0');

  const msgs = CHATS[currentChatTicketId] || [];
  const protocol = {
    id: protocolId,
    ticketId: t.id,
    ticketTitle: t.title,
    ticketCat: t.cat,
    ticketDept: t.dept,
    ticketPrio: t.prio,
    userName: t.name,
    userEmail: t.email,
    closedBy: currentUser.id,
    closedByName: currentUser.name,
    closedAt: now.toISOString(),
    summary: summary || 'Sem resumo informado.',
    totalMsgs: msgs.length,
  };
  PROTOCOLS.push(protocol);

  // Marcar chat como encerrado
  t.chatClosed = true;
  t.chatProtocolId = protocolId;

  // Adicionar mensagem de sistema no chat
  if (!CHATS[t.id]) CHATS[t.id] = [];
  CHATS[t.id].push({
    id: Date.now(),
    senderId: 0,
    senderName: 'Sistema Fox Smart',
    senderRole: 'system',
    senderColor: '#FF4747',
    text: `🔴 Este chat foi encerrado por ${currentUser.name}.\nProtocolo: ${protocolId}`,
    ts: now.toISOString(),
    read: true,
    isSystem: true,
  });

  closeEndChatModal();
  closeChatModal();

  // Mostrar modal de protocolo
  showProtocol(protocol);

  renderTickets();
  if (currentUser.role === 'admin') renderAdmin();
  if (currentUser.role === 'attendant') renderAttendantPanel();
}

function showProtocol(protocol) {
  const closedAt = new Date(protocol.closedAt);
  const dateStr = closedAt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  const timeStr = closedAt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const prioMap = { low:'Baixa', med:'Média', high:'Alta' };

  document.getElementById('protocol-content').innerHTML = `
    <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <div style="font-size:22px;font-family:'Bebas Neue',sans-serif;letter-spacing:.1em;color:var(--green)">${protocol.id}</div>
      <div style="color:var(--grey-600);font-size:10px;margin-top:2px">PROTOCOLO DE ATENDIMENTO</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">
      <div><span style="color:var(--grey-600)">Chamado:</span> <span style="color:var(--white)">${protocol.ticketId}</span></div>
      <div><span style="color:var(--grey-600)">Encerrado em:</span> <span style="color:var(--white)">${dateStr} às ${timeStr}</span></div>
      <div><span style="color:var(--grey-600)">Solicitante:</span> <span style="color:var(--white)">${protocol.userName}</span></div>
      <div><span style="color:var(--grey-600)">Encerrado por:</span> <span style="color:var(--white)">${protocol.closedByName}</span></div>
      <div><span style="color:var(--grey-600)">Categoria:</span> <span style="color:var(--white)">${protocol.ticketCat}</span></div>
      <div><span style="color:var(--grey-600)">Prioridade:</span> <span style="color:var(--white)">${prioMap[protocol.ticketPrio]||protocol.ticketPrio}</span></div>
      <div style="grid-column:span 2"><span style="color:var(--grey-600)">Título:</span> <span style="color:var(--white)">${protocol.ticketTitle}</span></div>
      <div style="grid-column:span 2"><span style="color:var(--grey-600)">Mensagens trocadas:</span> <span style="color:var(--white)">${protocol.totalMsgs}</span></div>
      <div style="grid-column:span 2;margin-top:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07)">
        <div style="color:var(--grey-600);margin-bottom:4px">Resumo:</div>
        <div style="color:var(--white);line-height:1.6">${protocol.summary}</div>
      </div>
    </div>
  `;
  document.getElementById('protocol-modal-overlay').classList.add('open');
}

function closeProtocolModal() {
  document.getElementById('protocol-modal-overlay').classList.remove('open');
}

function copyProtocol() {
  const content = document.getElementById('protocol-content').innerText;
  navigator.clipboard.writeText(content).then(() => {
    const btn = document.querySelector('#protocol-modal-overlay .btn-icon');
    const orig = btn.textContent;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function downloadProtocolPDF() {
  const protocol = PROTOCOLS[PROTOCOLS.length - 1];
  if (!protocol) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ── Paleta ──────────────────────────────────────
  const BLACK   = [10, 10, 9];
  const WHITE   = [255, 255, 255];
  const ACCENT  = [255, 59, 0];
  const GREEN   = [0, 200, 83];
  const GREY_BG = [22, 22, 20];
  const GREY_MID= [40, 40, 38];
  const GREY_L  = [80, 80, 76];
  const GREY_LL = [154, 154, 148];

  // ── Fundo total ─────────────────────────────────
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, pageW, pageH, 'F');

  // ── Faixa topo (accent) ─────────────────────────
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 3, 'F');

  // ── Cabeçalho ────────────────────────────────────
  let y = 14;

  // Logo texto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('FOX SMART', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY_LL);
  doc.text('HELPDESK — PROTOCOLO DE ATENDIMENTO', margin, y + 6);

  // Número do protocolo (direita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ACCENT);
  doc.text(protocol.id, pageW - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GREY_LL);
  doc.text('Nº DO PROTOCOLO', pageW - margin, y + 5.5, { align: 'right' });

  // Linha separadora
  y += 14;
  doc.setDrawColor(...GREY_MID);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Badge "ATENDIMENTO ENCERRADO" ───────────────
  const badgeW = 62, badgeH = 7, badgeR = 1.5;
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin, y - 5.2, badgeW, badgeH, badgeR, badgeR, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.text('✓  ATENDIMENTO ENCERRADO', margin + badgeW / 2, y - 0.5, { align: 'center' });
  y += 8;

  // ── Seção: Dados do Chamado ──────────────────────
  const drawSectionTitle = (title, yPos) => {
    doc.setFillColor(...GREY_MID);
    doc.rect(margin, yPos, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY_LL);
    doc.text(title, margin + 3, yPos + 4.8);
    return yPos + 11;
  };

  const drawRow = (label, value, yPos, highlight = false) => {
    if (highlight) {
      doc.setFillColor(30, 30, 28);
      doc.rect(margin, yPos - 4, contentW, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GREY_LL);
    doc.text(label, margin + 3, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(String(value), margin + 52, yPos);
    return yPos + 7.5;
  };

  const prioMap = { low: 'Baixa', med: 'Média', high: 'Alta' };
  const closedAt = new Date(protocol.closedAt);
  const dateStr = closedAt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  const timeStr = closedAt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  y = drawSectionTitle('// DADOS DO CHAMADO', y);
  y = drawRow('Chamado (ID):', protocol.ticketId, y, false);
  y = drawRow('Título:', protocol.ticketTitle, y, true);
  y = drawRow('Categoria:', protocol.ticketCat, y, false);
  y = drawRow('Departamento:', protocol.ticketDept, y, true);
  y = drawRow('Prioridade:', prioMap[protocol.ticketPrio] || protocol.ticketPrio, y, false);
  y += 4;

  y = drawSectionTitle('// SOLICITANTE', y);
  y = drawRow('Nome:', protocol.userName, y, false);
  y = drawRow('E-mail:', protocol.userEmail, y, true);
  y += 4;

  y = drawSectionTitle('// ATENDIMENTO', y);
  y = drawRow('Encerrado por:', protocol.closedByName, y, false);
  y = drawRow('Data de encerramento:', dateStr, y, true);
  y = drawRow('Horário:', timeStr, y, false);
  y = drawRow('Mensagens trocadas:', String(protocol.totalMsgs), y, true);
  y += 4;

  // ── Seção: Resumo ────────────────────────────────
  y = drawSectionTitle('// RESUMO DO ATENDIMENTO', y);
  doc.setFillColor(18, 18, 16);
  const summaryText = doc.splitTextToSize(protocol.summary, contentW - 10);
  const summaryH = summaryText.length * 5.5 + 8;
  doc.rect(margin, y - 2, contentW, summaryH, 'F');
  doc.setDrawColor(...GREY_MID);
  doc.setLineWidth(0.2);
  doc.rect(margin, y - 2, contentW, summaryH);
  // Borda esquerda colorida
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.2);
  doc.line(margin, y - 2, margin, y - 2 + summaryH);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  summaryText.forEach((line, i) => {
    doc.text(line, margin + 6, y + 3.5 + i * 5.5);
  });
  y += summaryH + 8;

  // ── Histórico do chat ─────────────────────────────
  const msgs = (CHATS[protocol.ticketId] || []).filter(m => !m.isSystem);
  if (msgs.length > 0) {
    y = drawSectionTitle('// HISTÓRICO DO CHAT', y);

    msgs.forEach((m, idx) => {
      if (y > pageH - 30) {
        doc.addPage();
        doc.setFillColor(...BLACK);
        doc.rect(0, 0, pageW, pageH, 'F');
        doc.setFillColor(...ACCENT);
        doc.rect(0, 0, pageW, 2, 'F');
        y = 14;
      }

      const ts = new Date(m.ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      const roleLabel = m.senderRole === 'admin' ? 'Admin' : m.senderRole === 'attendant' ? 'Atendente' : 'Usuário';
      const isStaff = m.senderRole !== 'user';
      const bubbleColor = isStaff ? [30, 20, 14] : [14, 20, 35];
      const nameColor   = isStaff ? ACCENT : [77, 144, 254];

      const lines = doc.splitTextToSize(m.text, contentW - 16);
      const bubH = lines.length * 5 + 9;

      doc.setFillColor(...bubbleColor);
      doc.roundedRect(margin, y, contentW, bubH, 1.5, 1.5, 'F');

      // Nome + role
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...nameColor);
      doc.text(`${m.senderName}`, margin + 4, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GREY_LL);
      doc.text(`[${roleLabel}]`, margin + 4 + doc.getTextWidth(`${m.senderName}`) + 2, y + 5.5);

      // Horário
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GREY_L);
      doc.text(ts, margin + contentW - 4, y + 5.5, { align: 'right' });

      // Texto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      lines.forEach((line, li) => {
        doc.text(line, margin + 4, y + 10.5 + li * 5);
      });

      y += bubH + 3;
    });

    y += 4;
  }

  // ── Rodapé ───────────────────────────────────────
  const footerY = pageH - 12;
  doc.setDrawColor(...GREY_MID);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
  doc.setFillColor(...ACCENT);
  doc.rect(0, pageH - 2.5, pageW, 2.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY_L);
  doc.text(`Fox Smart Helpdesk  ·  Protocolo ${protocol.id}  ·  Gerado em ${dateStr} às ${timeStr}`, margin, footerY);
  doc.text('Documento gerado automaticamente pelo sistema.', pageW - margin, footerY, { align: 'right' });

  doc.save(`protocolo-${protocol.id}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('end-chat-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEndChatModal();
  });
  document.getElementById('protocol-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProtocolModal();
  });
});

// Indicador de mensagens não lidas no botão de histórico do usuário
function getUnreadCount(userId) {
  let total = 0;
  allTickets.filter(t => t.userId === userId).forEach(t => {
    if (CHATS[t.id]) {
      total += CHATS[t.id].filter(m => !m.read && m.senderId !== userId).length;
    }
  });
  return total;
}
