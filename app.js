/* ==========================================================
   Refugio — lógica de la aplicación
   TB1 Lean Management · UPC
   ========================================================== */

(function () {
  "use strict";

  const KEY = "refugio_demo_v1";

  /* ───────── Estado ───────── */

  function estadoInicial() {
    return {
      alias: null,
      grado: null,
      avatar: "🦊",
      intereses: [],
      entradas: [],
      animos: [],
      posts: JSON.parse(JSON.stringify(POSTS_SEMILLA)),
      chats: {},
      alertaCerrada: null,
      canal: "todos",
      semaforo: null,
      comento: false
    };
  }

  let S = cargar();
  let postActivo = null;
  let psiActivo = null;
  let canalNuevoPost = "desahogo";

  function cargar() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return estadoInicial();
      return Object.assign(estadoInicial(), JSON.parse(raw));
    } catch (e) { return estadoInicial(); }
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ───────── Utilidades ───────── */

  const $ = (sel) => document.querySelector(sel);   const $$ = (sel) => document.querySelectorAll(sel);

  function toast(msg) {
    const t = $("#toast");     t.textContent = msg;     t.hidden = false;     clearTimeout(t._tid);     t._tid = setTimeout(() => { t.hidden = true; }, 2200);   }    function hora() {     return new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });   }    function esc(s) {     const d = document.createElement("div");     d.textContent = s;     return d.innerHTML;   }    const SVG_UP = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';   const SVG_DOWN = '<svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';   const SVG_COM = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5Z"/></svg>';   const SVG_SAVE = '<svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>';    /* ───────── Navegación ───────── */    const CON_TABS = ["feed", "espacio", "apoyo", "perfil"];    function ir(pantalla) {     $$(".screen").forEach(s => { s.hidden = s.dataset.screen !== pantalla; });
    const tabs = $("#tabs");
    tabs.hidden = !CON_TABS.includes(pantalla);
    $$(".tab").forEach(t => t.classList.toggle("is-on", t.dataset.nav === pantalla));      if (pantalla === "feed")    { pintarBarraMe(); pintarCanales(); pintarFeed(); }     if (pantalla === "espacio") { pintarTags(); pintarEntradas(); pintarSemaforo(); }     if (pantalla === "apoyo")   { pintarApoyo(); }     if (pantalla === "perfil")  { pintarPerfil(); }     if (pantalla === "checkin") { $$
(".mood").forEach(m => m.classList.remove("is-on")); }

    const act = document.querySelector('.screen:not([hidden])');
    if (act) act.scrollTop = 0;
  }

  /* ───────── Registro ───────── */

  function pintarAvatares() {
    const cont = $("#avatar-picker");     cont.innerHTML = "";     AVATARES.forEach((a, i) => {       const b = document.createElement("button");       b.type = "button";       b.className = "av" + (i === 0 ? " is-on" : "");       b.textContent = a;       b.addEventListener("click", () => {         $$(".av").forEach(x => x.classList.remove("is-on"));
        b.classList.add("is-on");
        S.avatar = a;
      });
      cont.appendChild(b);
    });
    S.avatar = AVATARES[0];
  }

  $("#form-register").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    S.alias = (fd.get("alias") || "").trim() || "Anónimo";
    S.grado = fd.get("grado");
    guardar();
    ir("checkin");
  });

  /* ───────── Check-in ───────── */

  $("#moods").addEventListener("click", (e) => {     const b = e.target.closest(".mood");     if (!b) return;     $$(".mood").forEach(m => m.classList.remove("is-on"));
    b.classList.add("is-on");
    S.animos.push({ v: Number(b.dataset.value), fecha: Date.now() });
    guardar();
    setTimeout(() => {
      ir("feed");
      if (animoBajo()) toast("Recuerda que puedes hablar con alguien en Apoyo 💛");
    }, 420);
  });

  function animoBajo() {
    const ult = S.animos.slice(-3);
    return ult.length >= 3 && ult.every(a => a.v <= 2);
  }

  /* ───────── Barra / canales ───────── */

  function pintarBarraMe() {
    $("#bar-me").textContent = S.avatar || "🦊";
  }

  function pintarCanales() {
    const cont = $("#channels");
    cont.innerHTML = "";
    CANALES.forEach(c => {
      const b = document.createElement("button");
      b.className = "chan" + (S.canal === c.id ? " is-on" : "");
      b.innerHTML = `<span>${c.emoji}</span>${esc(c.nombre)}`;
      b.addEventListener("click", () => {
        S.canal = c.id; guardar(); pintarCanales(); pintarFeed();
      });
      cont.appendChild(b);
    });
  }

  /* ───────── Feed ───────── */

  function nombreCanal(id) {
    const c = CANALES.find(x => x.id === id);
    return c ? c.emoji + " " + c.nombre : id;
  }

  function pintarFeed() {
    const cont = $("#feed");
    cont.innerHTML = "";
    const lista = S.canal === "todos" ? S.posts : S.posts.filter(p => p.canal === S.canal);

    if (!lista.length) {
      cont.innerHTML = '<p class="empty">Todavía no hay publicaciones en este canal.<br>Anímate a ser el primero.</p>';
      return;
    }

    lista.forEach(p => {
      const art = document.createElement("article");
      art.className = "post";
      art.innerHTML = `
        <div class="post__top">
          <div class="post__av">${esc(p.avatar)}</div>
          <div class="post__who">
            <span class="post__author">${esc(p.autor)}</span>
            <span class="post__meta">${esc(p.tiempo)}</span>
          </div>
          <span class="post__chan">${nombreCanal(p.canal)}</span>
        </div>
        <h3 class="post__title">${esc(p.titulo)}</h3>
        <p class="post__text post__text--clamp">${esc(p.texto)}</p>
        ${p.imagen ? `<div class="post__media">${p.imagen}</div>` : ""}
        <div class="post__bar">
          <div class="vote">
            <button class="vote__btn ${p.voto === 1 ? "is-up" : ""}" data-v="1">${SVG_UP}</button>
            <span class="vote__n">${p.votos}</span>
            <button class="vote__btn ${p.voto === -1 ? "is-down" : ""}" data-v="-1">${SVG_DOWN}</button>
          </div>
          <button class="pill" data-open="1">${SVG_COM} ${p.comentarios.length}</button>
          <button class="pill ${p.guardado ? "is-on" : ""}" data-save="1">${SVG_SAVE}</button>
        </div>`;

      art.querySelectorAll(".vote__btn").forEach(btn => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          votar(p, Number(btn.dataset.v));
          pintarFeed();
        });
      });
      art.querySelector("[data-save]").addEventListener("click", (ev) => {
        ev.stopPropagation();
        p.guardado = !p.guardado; guardar();
        toast(p.guardado ? "Guardado" : "Quitado de guardados");
        pintarFeed();
      });
      art.addEventListener("click", () => abrirPost(p));
      cont.appendChild(art);
    });
  }

  function votar(obj, dir) {
    if (obj.voto === dir) { obj.votos -= dir; obj.voto = 0; }
    else { obj.votos += dir - obj.voto; obj.voto = dir; }
    guardar();
  }

  /* ───────── Detalle del post ───────── */

  function abrirPost(p) {
    postActivo = p;
    ir("post");
    pintarPost();
  }

  function pintarPost() {
    const p = postActivo;
    if (!p) return;
    const cont = $("#post-detail");
    cont.innerHTML = `
      <article class="post" style="cursor:default">
        <div class="post__top">
          <div class="post__av">${esc(p.avatar)}</div>
          <div class="post__who">
            <span class="post__author">${esc(p.autor)}</span>
            <span class="post__meta">${esc(p.tiempo)}</span>
          </div>
          <span class="post__chan">${nombreCanal(p.canal)}</span>
        </div>
        <h3 class="post__title">${esc(p.titulo)}</h3>
        <p class="post__text">${esc(p.texto)}</p>
        ${p.imagen ? `<div class="post__media">${p.imagen}</div>` : ""}
        <div class="post__bar">
          <div class="vote">
            <button class="vote__btn ${p.voto === 1 ? "is-up" : ""}" data-v="1">${SVG_UP}</button>
            <span class="vote__n">${p.votos}</span>
            <button class="vote__btn ${p.voto === -1 ? "is-down" : ""}" data-v="-1">${SVG_DOWN}</button>
          </div>
          <button class="pill ${p.guardado ? "is-on" : ""}" data-save="1">${SVG_SAVE}</button>
        </div>
      </article>
      <h4 class="comments__h">${p.comentarios.length} comentario${p.comentarios.length === 1 ? "" : "s"}</h4>
      <div class="comments" id="comments"></div>`;

    cont.querySelectorAll(".vote__btn").forEach(btn => {
      btn.addEventListener("click", () => { votar(p, Number(btn.dataset.v)); pintarPost(); });
    });
    cont.querySelector("[data-save]").addEventListener("click", () => {
      p.guardado = !p.guardado; guardar();
      toast(p.guardado ? "Guardado" : "Quitado de guardados");
      pintarPost();
    });

    const cbox = $("#comments");
    p.comentarios.forEach(c => {
      const d = document.createElement("div");
      d.className = "comment";
      d.innerHTML = `
        <div class="comment__av">${esc(c.avatar)}</div>
        <div class="comment__body">
          <div class="comment__top">
            <span class="comment__who">${esc(c.autor)}</span>
            <span class="comment__time">${esc(c.tiempo)}</span>
          </div>
          <p class="comment__txt">${esc(c.texto)}</p>
          <div class="vote">
            <button class="vote__btn ${c.voto === 1 ? "is-up" : ""}" data-v="1">${SVG_UP}</button>
            <span class="vote__n">${c.votos}</span>
            <button class="vote__btn ${c.voto === -1 ? "is-down" : ""}" data-v="-1">${SVG_DOWN}</button>
          </div>
        </div>`;
      d.querySelectorAll(".vote__btn").forEach(btn => {
        btn.addEventListener("click", () => { votar(c, Number(btn.dataset.v)); pintarPost(); });
      });
      cbox.appendChild(d);
    });
  }

  $("#comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#comment-input");
    const txt = inp.value.trim();
    if (!txt || !postActivo) return;
    postActivo.comentarios.push({
      id: "c" + Date.now(), autor: S.alias, avatar: S.avatar,
      texto: txt, votos: 1, voto: 1, tiempo: "ahora"
    });
    guardar();
    inp.value = "";
    pintarPost();
    toast("Comentario publicado");

    if (!S.comento) {
      setTimeout(() => { $("#sheet-survey").hidden = false; }, 400);
      S.comento = true;
      guardar();
    }
  });

  /* ───────── Crear publicación ───────── */

  function abrirCompose() {
    $("#post-as").textContent = S.avatar + " " + S.alias;
    const cont = $("#post-channels");
    cont.innerHTML = "";
    CANALES.filter(c => c.id !== "todos").forEach((c, i) => {
      if (i === 0) canalNuevoPost = c.id;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chan" + (i === 0 ? " is-on" : "");
      b.innerHTML = `<span>${c.emoji}</span>${esc(c.nombre)}`;
      b.addEventListener("click", () => {
        cont.querySelectorAll(".chan").forEach(x => x.classList.remove("is-on"));
        b.classList.add("is-on");
        canalNuevoPost = c.id;
      });
      cont.appendChild(b);
    });
    $("#sheet-compose").hidden = false;
  }

  $("#form-post").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    S.posts.unshift({
      id: "post" + Date.now(),
      autor: S.alias, avatar: S.avatar, canal: canalNuevoPost, tiempo: "ahora",
      titulo: (fd.get("titulo") || "").trim(),
      texto: (fd.get("texto") || "").trim(),
      votos: 1, voto: 1, guardado: false, comentarios: []
    });
    guardar();
    e.target.reset();
    $("#sheet-compose").hidden = true;
    S.canal = "todos";
    pintarCanales(); pintarFeed();
    toast("Publicado de forma anónima ✨");
  });

  /* ───────── Mi espacio ───────── */

  function pintarTags() {
    const cont = $("#tags");
    cont.innerHTML = "";
    INTERESES.forEach(t => {
      const b = document.createElement("button");
      const on = S.intereses.includes(t);
      b.className = "tag" + (on ? " is-on" : "");
      b.textContent = t;
      b.addEventListener("click", () => {
        const i = S.intereses.indexOf(t);
        if (i >= 0) S.intereses.splice(i, 1); else S.intereses.push(t);
        guardar(); pintarTags();
      });
      cont.appendChild(b);
    });
  }

  function pintarEntradas() {
    const cont = $("#entries");
    cont.innerHTML = "";
    if (!S.entradas.length) {
      cont.innerHTML = '<p class="empty">Aún no has escrito nada.<br>Este espacio te espera cuando quieras.</p>';
      return;
    }
    S.entradas.slice().reverse().forEach(e => {
      const d = document.createElement("div");
      d.className = "entry";
      const f = new Date(e.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      d.innerHTML = `<span class="entry__date">${f}</span><p class="entry__txt">${esc(e.texto)}</p>`;
      cont.appendChild(d);
    });
  }

  function pintarSemaforo() {
    $$(".sem-btn").forEach(btn => {
      btn.classList.toggle("is-on", btn.dataset.color === S.semaforo);
    });
    const btnCita = $("#btn-pedir-cita");
    if (btnCita) btnCita.hidden = (S.semaforo !== "rojo");
  }

  /* ───────── Apoyo ───────── */

  function pintarApoyo() {
    const alerta = $("#alert-card");
    const cerrada = S.alertaCerrada && (Date.now() - S.alertaCerrada < 120000);
    alerta.hidden = !(animoBajo() && !cerrada);

    const cont = $("#psi-list");
    cont.innerHTML = "";
    PSICOLOGOS.forEach(p => {
      const b = document.createElement("button");
      b.className = "psi";
      b.innerHTML = `
        <div class="psi__av" style="background:${p.color}">
          ${p.inicial}
          <span class="psi__dot dot--${p.estado.replace(/\s/g, ".")}"></span>
        </div>
        <div class="psi__body">
          <p class="psi__name">${esc(p.nombre)}</p>
          <p class="psi__rol">${esc(p.rol)}</p>
          <div class="psi__status" style="color:${colorEstado(p.estado)}">
            <i style="background:${colorEstado(p.estado)}"></i>${etiquetaEstado(p.estado)}
          </div>
          <p class="psi__meta">${esc(p.horario)}<br>${esc(p.responde)}</p>
        </div>`;
      b.addEventListener("click", () => abrirChat(p));
      cont.appendChild(b);
    });
  }

  function colorEstado(e) {
    if (e === "en linea") return "#00A896";
    if (e === "ocupado") return "#D99A18";
    return "#8C87A6";
  }
  function etiquetaEstado(e) {
    if (e === "en linea") return "En línea ahora";
    if (e === "ocupado") return "Ocupado · te responderá luego";
    return "Desconectado";
  }

  /* ───────── Chat ───────── */

  function abrirChat(p) {
    psiActivo = p;
    ir("chat");

    $("#chat-head").innerHTML = `
      <div class="chat-head__av" style="background:${p.color}">
        ${p.inicial}
        <span class="psi__dot" style="background:${colorEstado(p.estado)}"></span>
      </div>
      <div class="chat-head__info">
        <span class="chat-head__name">${esc(p.nombre)}</span>
        <span class="chat-head__st"><i style="background:${colorEstado(p.estado)}"></i>${etiquetaEstado(p.estado)}</span>
      </div>`;

    if (!S.chats[p.id]) {
      S.chats[p.id] = [{
        de: "psi",
        texto: `Hola${S.alias ? ", " + S.alias : ""}. Soy ${p.nombre.split(" ")[0]}, ${p.rol.toLowerCase()} del colegio. ${p.bio}`,
        hora: hora()
      }];
      guardar();
    }
    pintarChat();
  }

  function pintarChat() {
    const box = $("#chat-messages");
    box.innerHTML = `<p class="chat__sys">🔒 Esta conversación es privada. Nadie de tu salón puede verla.</p>`;
    (S.chats[psiActivo.id] || []).forEach(m => {
      const d = document.createElement("div");
      d.className = "bubble bubble--" + (m.de === "psi" ? "psi" : "me");
      d.innerHTML = `${esc(m.texto)}<span class="bubble__t">${esc(m.hora)}</span>`;
      box.appendChild(d);
    });
    box.scrollTop = box.scrollHeight;
  }

  let idxResp = 0;
  $("#chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#chat-input");
    const txt = inp.value.trim();
    if (!txt || !psiActivo) return;

    S.chats[psiActivo.id].push({ de: "me", texto: txt, hora: hora() });
    guardar(); inp.value = ""; pintarChat();

    const box = $("#chat-messages");
    const t = document.createElement("div");
    t.className = "typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    box.appendChild(t);
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
      t.remove();
      S.chats[psiActivo.id].push({
        de: "psi",
        texto: RESPUESTAS_PSICOLOGO[idxResp % RESPUESTAS_PSICOLOGO.length],
        hora: hora()
      });
      idxResp++;
      guardar(); pintarChat();
    }, 1300);
  });

  /* ───────── Perfil ───────── */

  function pintarPerfil() {
    $("#profile").innerHTML = `
      <div class="profile__av">${esc(S.avatar)}</div>
      <p class="profile__name">${esc(S.alias || "Anónimo")}</p>
      <p class="profile__grade">${esc(S.grado || "—")}</p>
      <div class="profile__stats">
        <div class="profile__stat"><b>${S.posts.filter(p => p.autor === S.alias).length}</b><span>publicaciones</span></div>
        <div class="profile__stat"><b>${S.entradas.length}</b><span>entradas</span></div>
        <div class="profile__stat"><b>${S.intereses.length}</b><span>intereses</span></div>
      </div>`;

    const chart = $("#mood-chart");
    chart.innerHTML = "";
    const ult = S.animos.slice(-7);
    if (!ult.length) {
      chart.innerHTML = '<p class="empty" style="width:100%">Aún no has hecho ningún check-in.</p>';
      return;
    }
    ult.forEach((a, i) => {
      const col = document.createElement("div");
      col.className = "chart__col";
      const caras = ["", "😞", "😕", "😐", "🙂", "😄"];
      col.innerHTML = `
        <div class="chart__bar" style="height:${a.v * 18}%; background:${a.v <= 2 ? "#FF6B6B" : a.v === 3 ? "#FFC44D" : "#5B4AE8"}"></div>
        <span class="chart__lbl">${caras[a.v]}</span>`;
      chart.appendChild(col);
    });
  }

  /* ───────── Acciones globales ───────── */

  document.body.addEventListener("click", (e) => {
    
    const semBtn = e.target.closest(".sem-btn");
    if (semBtn) {
      S.semaforo = semBtn.dataset.color;
      guardar();
      pintarSemaforo();
      return;
    }

    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;

    if (a === "start")            ir(S.alias ? "checkin" : "register");
    else if (a === "go-splash")   ir("splash");
    else if (a === "skip-checkin") ir("feed");
    else if (a === "go-feed")     ir("feed");
    else if (a === "go-espacio")  ir("espacio");
    else if (a === "go-apoyo")    ir("apoyo");
    else if (a === "go-perfil")   ir("perfil");
    else if (a === "open-compose") abrirCompose();
    else if (a === "close-compose") $("#sheet-compose").hidden = true;
    else if (a === "close-survey") $("#sheet-survey").hidden = true;
    else if (a === "survey-ans") {
      $("#sheet-survey").hidden = true;
      toast("Gracias por tu respuesta 💛");
    }
    else if (a === "open-first-chat") abrirChat(PSICOLOGOS[0]);
    else if (a === "save-entry") {
      const inp = $("#journal-input");
      const txt = inp.value.trim();
      if (!txt) { toast("Escribe algo primero"); return; }
      S.entradas.push({ texto: txt, fecha: Date.now() });
      guardar(); inp.value = ""; pintarEntradas();
      toast("Guardado en tu diario 🔒");
    }
    else if (a === "reset") {
      if (confirm("¿Borrar todos los datos de la demo y empezar de nuevo?")) {
        localStorage.removeItem(KEY);
        S = estadoInicial();
        pintarAvatares();
        ir("splash");
      }
    }
  });

  $("#sheet-compose").addEventListener("click", (e) => {
    if (e.target.id === "sheet-compose") $("#sheet-compose").hidden = true;
  });

  /* ───────── Inicio ───────── */

  pintarAvatares();
  if (S.alias) { S.avatar = S.avatar || "🦊"; ir("checkin"); }
  else ir("splash");

})();
