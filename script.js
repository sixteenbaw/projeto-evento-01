const form = document.getElementById("registration-form");
const feedback = document.getElementById("form-feedback");
const API_BASE =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:3000"
    : window.location.origin;
const IS_LOCAL_SERVER =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

function saveLocalSubmission(entry) {
  const existing = JSON.parse(localStorage.getItem("orbitanexus_inscricoes") || "[]");
  existing.unshift({
    ...entry,
    enviadoEm: new Date().toISOString()
  });
  localStorage.setItem("orbitanexus_inscricoes", JSON.stringify(existing));
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

if (form && feedback) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    feedback.classList.remove("is-error");
    feedback.textContent = "Enviando inscrição...";

    const formPayload = Object.fromEntries(new FormData(form).entries());

    try {
      if (!IS_LOCAL_SERVER) {
        saveLocalSubmission(formPayload);
        const nome = formPayload.nome;
        feedback.textContent = `Inscrição registrada neste navegador com sucesso, ${nome}. Na versão publicada no Vercel, esse modo serve como demonstração do formulário.`;
        form.reset();
        return;
      }

      const response = await fetch(`${API_BASE}/api/inscricoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Falha no envio");
      }

      const nome = formPayload.nome;
      feedback.textContent = `Inscrição enviada com sucesso, ${nome}. Você já pode consultar esse envio na área "Inscrições".`;
      form.reset();
    } catch (error) {
      feedback.classList.add("is-error");
      feedback.textContent = `Não foi possível enviar agora. Verifique se o servidor está aberto em http://127.0.0.1:3000. Detalhe: ${error.message}`;
    }
  });
}

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatWindow = document.getElementById("chat-window");
const quickChips = document.querySelectorAll(".quick-chip");
const chatHistory = [];

const knowledgeBase = [
  {
    intent: "saudacao",
    keywords: ["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "e ai", "eae"],
    answer: "Oi! Eu sou a Nia, assistente do Órbita Nexus Live. Posso te ajudar com programação, inscrição, local, público, vagas, contato, certificado, acessibilidade e muito mais."
  },
  {
    intent: "local",
    keywords: ["local", "onde", "endereco", "endereço", "fica", "mapa", "como chegar"],
    answer: "O Órbita Nexus Live acontece no Arca Hub, na Av. Manuel Bandeira, 360, em São Paulo/SP."
  },
  {
    intent: "horario",
    keywords: ["horario", "horário", "hora", "que horas", "inicio", "comeca", "começa", "termina", "fim"],
    answer: "O evento será no dia 18 de julho de 2026, das 09h00 às 19h00. O credenciamento começa às 09h00."
  },
  {
    intent: "programacao",
    keywords: ["programacao", "programação", "agenda", "cronograma", "roteiro", "atividades"],
    answer: "A programação inclui credenciamento, abertura, painel Nexus, labs simultâneos, mentorias curtas, case show e encerramento."
  },
  {
    intent: "detalhe_programacao",
    keywords: ["painel", "labs", "lab", "mentorias", "mentoria", "oficinas", "case show", "encerramento", "credenciamento"],
    answer: "Pela manhã teremos recepção, abertura e painel principal. À tarde acontecem labs práticos, mentorias curtas e o case show com soluções criadas com IA."
  },
  {
    intent: "inscricao",
    keywords: ["inscricao", "inscrição", "inscrever", "cadastro", "vaga", "vagas", "garantir vaga"],
    answer: "A inscrição é gratuita e feita pelo formulário desta página. Depois de enviar, os dados ficam salvos no painel de inscrições."
  },
  {
    intent: "valor",
    keywords: ["valor", "preco", "preço", "custa", "gratuito", "pago", "pagamento"],
    answer: "Nesta proposta, o evento é gratuito mediante inscrição antecipada."
  },
  {
    intent: "publico",
    keywords: ["publico", "público", "quem pode", "participar", "pra quem", "para quem", "perfil"],
    answer: "O evento foi pensado para estudantes, profissionais criativos, pessoas de tecnologia, marketing, design, empreendedores e gestores de inovação."
  },
  {
    intent: "empresa",
    keywords: ["empresa", "organizadora", "organizacao", "organização", "quem organiza", "realizacao", "realização"],
    answer: "A empresa organizadora é a VoxLabs Experience."
  },
  {
    intent: "objetivo",
    keywords: ["objetivo", "proposta", "tema", "sobre o evento", "qual e a ideia", "qual é a ideia"],
    answer: "O objetivo do Órbita Nexus Live é mostrar como criatividade, estratégia e inteligência artificial podem gerar experiências, projetos e negócios mais fortes."
  },
  {
    intent: "palestrantes",
    keywords: ["palestrante", "palestrantes", "speaker", "speakers", "convidados", "quem vai falar"],
    answer: "A proposta prevê 14 convidados especiais entre profissionais de branding, tecnologia, criação digital e inovação."
  },
  {
    intent: "certificado",
    keywords: ["certificado", "certificacao", "certificação", "horas complementares", "comprovante"],
    answer: "Você pode considerar que haverá certificado digital de participação enviado após o evento, útil inclusive para horas complementares."
  },
  {
    intent: "alimentacao",
    keywords: ["alimentacao", "alimentação", "comida", "lanche", "coffee", "almoco", "almoço"],
    answer: "A proposta inclui coffee de boas-vindas no credenciamento. Se quiser, você pode complementar a apresentação dizendo que haverá opções de alimentação próximas ao local."
  },
  {
    intent: "estacionamento",
    keywords: ["estacionamento", "carro", "transporte", "metro", "metrô", "uber"],
    answer: "Como o evento é em São Paulo, a recomendação é usar transporte por aplicativo, metrô ou estacionamento da região do Arca Hub."
  },
  {
    intent: "acessibilidade",
    keywords: ["acessibilidade", "acessivel", "acessível", "pcd", "elevador", "rampa"],
    answer: "Sim. A proposta prevê um espaço com acessibilidade, circulação facilitada e atendimento preparado para diferentes necessidades do público."
  },
  {
    intent: "contato",
    keywords: ["contato", "email", "e mail", "whatsapp", "instagram", "falar com voces", "falar com vocês"],
    answer: "Você pode entrar em contato pelo e-mail contato@voxlabsxp.com.br, WhatsApp (11) 97777-2026 e Instagram @orbitanexuslive."
  },
  {
    intent: "levar",
    keywords: ["o que levar", "levar", "documento", "notebook", "celular", "entrada"],
    answer: "O ideal é levar documento com foto, celular carregado e, se quiser aproveitar melhor os labs, um notebook."
  },
  {
    intent: "vagas",
    keywords: ["quantas vagas", "vagas disponiveis", "vagas disponíveis", "limite", "capacidade"],
    answer: "A capacidade prevista é de 500 vagas."
  },
  {
    intent: "networking",
    keywords: ["networking", "conexoes", "conexões", "troca", "conhecer pessoas"],
    answer: "Sim. O evento foi desenhado para gerar networking, com arena de conexões e momentos de troca entre público, convidados e marcas."
  }
];

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = className;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function scoreEntry(entry, normalizedQuestion) {
  return entry.keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedQuestion.includes(normalizedKeyword)) {
      return score + Math.max(2, normalizedKeyword.split(" ").length * 2);
    }
    return score;
  }, 0);
}

function getFallbackReply(question) {
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return "Pode me perguntar sobre local, programação, inscrições, vagas, público, contato, certificado e estrutura do evento.";
  }

  const ranked = knowledgeBase
    .map((entry) => ({ ...entry, score: scoreEntry(entry, normalizedQuestion) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return "Posso te ajudar com local, horário, programação, inscrições, vagas, contato, certificado, acessibilidade, palestrantes e objetivo do evento. Se quiser, reformule sua pergunta com um desses temas.";
  }

  const top = ranked[0];
  const second = ranked[1];

  if (second && second.score >= top.score && second.intent !== top.intent) {
    return `${top.answer} Além disso, ${second.answer.charAt(0).toLowerCase()}${second.answer.slice(1)}`;
  }

  if (top.intent === "programacao" && normalizedQuestion.includes("detalhe")) {
    const detail = knowledgeBase.find((entry) => entry.intent === "detalhe_programacao");
    return `${top.answer} ${detail.answer}`;
  }

  return top.answer;
}

async function handleQuestion(question) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) return;

  addMessage(trimmedQuestion, "user-message");
  chatHistory.push({ role: "user", content: trimmedQuestion });

  const loadingMessage = document.createElement("div");
  loadingMessage.className = "bot-message";
  loadingMessage.textContent = "Pensando...";
  chatWindow.appendChild(loadingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  await new Promise((resolve) => setTimeout(resolve, 250));

  const reply = getFallbackReply(trimmedQuestion);
  loadingMessage.textContent = reply;
  chatHistory.push({ role: "assistant", content: reply });
}

if (chatForm && chatInput && chatWindow) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleQuestion(chatInput.value);
    chatInput.value = "";
    chatInput.focus();
  });
}

quickChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    const question = chip.dataset.question || "";
    await handleQuestion(question);
  });
});
