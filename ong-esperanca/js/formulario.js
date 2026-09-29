/* ==========================================================
   Instituto Semear Esperança — máscaras e validações do cadastro
   Funções puras (testáveis) + ligação com o DOM
   ========================================================== */

/* ---------- Funções puras ---------- */

function soDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function mascaraCPF(valor) {
  var d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
  if (d.length <= 9) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
}

function mascaraTelefone(valor) {
  var d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return "(" + d;
  if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
}

function mascaraCEP(valor) {
  var d = soDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + "-" + d.slice(5);
}

function cpfValido(valor) {
  var d = soDigitos(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 111.111.111-11 etc.

  function digito(base, pesoInicial) {
    var soma = 0;
    for (var i = 0; i < base.length; i++) {
      soma += parseInt(base.charAt(i), 10) * (pesoInicial - i);
    }
    var resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  var d1 = digito(d.slice(0, 9), 10);
  var d2 = digito(d.slice(0, 9) + d1, 11);
  return d1 === parseInt(d.charAt(9), 10) && d2 === parseInt(d.charAt(10), 10);
}

function maiorDeIdade(dataISO, hoje) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO || "")) return false;
  var partes = dataISO.split("-");
  var nasc = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  var ref = hoje || new Date();
  var idade = ref.getFullYear() - nasc.getFullYear();
  var fezAniversario =
    ref.getMonth() > nasc.getMonth() ||
    (ref.getMonth() === nasc.getMonth() && ref.getDate() >= nasc.getDate());
  if (!fezAniversario) idade--;
  return idade >= 18 && nasc <= ref;
}

/* ---------- Ligação com o DOM ---------- */

function iniciarFormulario() {
  var form = document.getElementById("form-cadastro");
  if (!form) return;

  var campoCPF = document.getElementById("cpf");
  var campoTel = document.getElementById("telefone");
  var campoCEP = document.getElementById("cep");
  var campoNasc = document.getElementById("nascimento");
  var campoMsg = document.getElementById("mensagem");
  var contador = document.getElementById("contador-mensagem");
  var status = document.getElementById("mensagem-status");

  // Data de nascimento não pode ser futura
  var hoje = new Date();
  var mm = String(hoje.getMonth() + 1).padStart(2, "0");
  var dd = String(hoje.getDate()).padStart(2, "0");
  campoNasc.max = hoje.getFullYear() + "-" + mm + "-" + dd;

  var mensagensPadrao = {
    nome: "Informe seu nome completo (mínimo de 5 caracteres).",
    email: "Informe um e-mail válido, como nome@exemplo.com.",
    cpf: "Informe o CPF no formato 000.000.000-00.",
    telefone: "Informe o telefone no formato (00) 00000-0000.",
    nascimento: "Informe sua data de nascimento.",
    cep: "Informe o CEP no formato 00000-000.",
    tipo: "Escolha como você quer ajudar.",
    lgpd: "É necessário concordar para continuar."
  };

  function textoErro(campo) {
    var v = campo.validity;
    if (v.customError) return campo.validationMessage;
    if (v.valueMissing) {
      if (campo.type === "radio") return mensagensPadrao.tipo;
      if (campo.type === "checkbox") return mensagensPadrao.lgpd;
      if (campo.tagName === "SELECT") return "Selecione uma opção.";
      return "Preencha este campo.";
    }
    if (v.tooShort) return mensagensPadrao[campo.id] || "Texto muito curto.";
    if (v.typeMismatch || v.patternMismatch) return mensagensPadrao[campo.id] || "Valor inválido.";
    if (v.rangeUnderflow || v.rangeOverflow) return "Data inválida.";
    return campo.validationMessage;
  }

  function idDoErro(campo) {
    return "erro-" + (campo.type === "radio" ? "tipo" : campo.id);
  }

  function mostrarErro(campo) {
    var alvo = document.getElementById(idDoErro(campo));
    if (!alvo) return;
    alvo.textContent = campo.checkValidity() ? "" : textoErro(campo);
  }

  function validarCustom(campo) {
    if (campo === campoCPF) {
      var completo = campo.value.length === 14;
      campo.setCustomValidity(completo && !cpfValido(campo.value) ? "CPF inválido. Confira os dígitos." : "");
    }
    if (campo === campoNasc) {
      var msg = campo.value && !maiorDeIdade(campo.value) ? "É necessário ter 18 anos ou mais." : "";
      campo.setCustomValidity(msg);
    }
  }

  function marcarTocado(campo) {
    campo.classList.add("tocado");
    validarCustom(campo);
    mostrarErro(campo);
  }

  // Máscaras
  function aplicarMascara(campo, funcao) {
    campo.addEventListener("input", function () {
      campo.value = funcao(campo.value);
      validarCustom(campo);
      if (campo.classList.contains("tocado")) mostrarErro(campo);
    });
  }

  aplicarMascara(campoCPF, mascaraCPF);
  aplicarMascara(campoTel, mascaraTelefone);
  aplicarMascara(campoCEP, mascaraCEP);

  // Preenchimento automático pelo CEP (melhoria opcional: falhas são ignoradas)
  campoCEP.addEventListener("input", function () {
    if (campoCEP.value.length !== 9 || !window.fetch) return;
    var cep = soDigitos(campoCEP.value);
    fetch("https://viacep.com.br/ws/" + cep + "/json/")
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        if (!dados || dados.erro) return;
        var mapa = { logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, uf: dados.uf };
        Object.keys(mapa).forEach(function (id) {
          var el = document.getElementById(id);
          if (el && mapa[id]) {
            el.value = mapa[id];
            el.classList.add("tocado");
            mostrarErro(el);
          }
        });
      })
      .catch(function () { /* sem conexão: o usuário preenche manualmente */ });
  });

  // Contador da mensagem
  campoMsg.addEventListener("input", function () {
    contador.textContent = campoMsg.value.length + " / " + campoMsg.maxLength + " caracteres";
  });

  // Feedback de validação campo a campo
  var campos = form.querySelectorAll("input, select, textarea");
  Array.prototype.forEach.call(campos, function (campo) {
    campo.addEventListener("blur", function () { marcarTocado(campo); });
    campo.addEventListener("change", function () { marcarTocado(campo); });
  });

  // Eventos "invalid" (validação nativa): mostramos as mensagens na própria página
  var jaFocou = false;
  form.addEventListener(
    "invalid",
    function (evento) {
      evento.preventDefault();
      var campo = evento.target;
      campo.classList.add("tocado");
      mostrarErro(campo);
      if (!jaFocou) {
        campo.focus();
        jaFocou = true;
      }
    },
    true
  );

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    jaFocou = false;
    Array.prototype.forEach.call(campos, validarCustom);
    if (!form.checkValidity()) {
      // Dispara os eventos "invalid" e dá foco ao primeiro erro
      form.reportValidity();
      status.hidden = false;
      status.className = "aviso aviso--erro";
      status.textContent = "Revise os campos destacados e tente novamente.";
      return;
    }
    var nome = document.getElementById("nome").value.trim().split(" ")[0];
    status.hidden = false;
    status.className = "aviso aviso--sucesso";
    status.textContent = "Obrigado, " + nome + "! Seu cadastro foi registrado (simulação, sem envio a servidor).";
    form.reset();
    Array.prototype.forEach.call(campos, function (c) { c.classList.remove("tocado"); });
    Array.prototype.forEach.call(form.querySelectorAll(".erro"), function (e) { e.textContent = ""; });
    contador.textContent = "0 / " + campoMsg.maxLength + " caracteres";
    status.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  form.addEventListener("reset", function () {
    status.hidden = true;
    Array.prototype.forEach.call(campos, function (c) {
      c.classList.remove("tocado");
      c.setCustomValidity("");
    });
    Array.prototype.forEach.call(form.querySelectorAll(".erro"), function (e) { e.textContent = ""; });
    contador.textContent = "0 / " + campoMsg.maxLength + " caracteres";
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarFormulario);
  } else {
    iniciarFormulario();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { soDigitos: soDigitos, mascaraCPF: mascaraCPF, mascaraTelefone: mascaraTelefone, mascaraCEP: mascaraCEP, cpfValido: cpfValido, maiorDeIdade: maiorDeIdade };
}
