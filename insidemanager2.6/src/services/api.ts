const API_URL = '/api';

// Função auxiliar para obter os cabeçalhos de requisição, incluindo o token de autenticação
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    // Adiciona o cabeçalho Authorization se o token existir no localStorage
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Objeto centralizado para chamadas de API usando fetch
export const api = {
  // Requisição GET
  async get(endpoint: string) {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // Requisição POST (Criação)
  async post(endpoint: string, body: any = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // Requisição PUT (Atualização)
  async put(endpoint: string, body: any = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // Requisição DELETE (Exclusão)
  async delete(endpoint: string, body?: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(errorBody || res.statusText);
    }
    return res.json();
  },
};
