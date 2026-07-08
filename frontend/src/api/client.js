const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const { token, body, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...fetchOptions,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível completar a solicitação.');
  }

  return data;
}

export function startChat(fullName) {
  return request('/api/chat/iniciar', {
    method: 'POST',
    body: { nome_usuario: fullName }
  });
}

export function sendMessage(sessionId, message) {
  return request('/api/chat/mensagem', {
    method: 'POST',
    body: {
      id_sessao: sessionId,
      mensagem: message
    }
  });
}

export function adminLogin(email, senha) {
  return request('/api/admin/login', {
    method: 'POST',
    body: { email, senha }
  });
}

export function getAdminConversations(token) {
  return request('/api/admin/conversas', {
    method: 'GET',
    token
  });
}

export function getAdminConversation(token, conversationId) {
  return request(`/api/admin/conversas/${conversationId}`, {
    method: 'GET',
    token
  });
}
