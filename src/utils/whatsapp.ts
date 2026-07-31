export interface WhatsAppApiConfig {
  enabled?: boolean;
  provider?: 'zapi' | 'evolution';
  apiUrl?: string;
  instanceId?: string;
  token?: string;
  clientToken?: string;
}

export async function sendWhatsAppApiMessage(
  phone: string,
  text: string,
  apiConfig?: WhatsAppApiConfig
): Promise<{ success: boolean; error?: string }> {
  if (!apiConfig?.enabled || !apiConfig.instanceId || !apiConfig.token) {
    return { success: false, error: 'API do WhatsApp não configurada ou desativada.' };
  }

  let phoneStr = phone.replace(/\D/g, '');
  if (!phoneStr) {
    return { success: false, error: 'Número de telefone inválido.' };
  }
  if (!phoneStr.startsWith('55') && phoneStr.length <= 11) {
    phoneStr = `55${phoneStr}`;
  }

  const provider = apiConfig.provider || (apiConfig.apiUrl?.includes('z-api') ? 'zapi' : 'zapi');

  try {
    if (provider === 'zapi') {
      const baseUrl = apiConfig.apiUrl ? apiConfig.apiUrl.replace(/\/$/, '') : 'https://api.z-api.io';
      const instanceId = apiConfig.instanceId.trim();
      const token = apiConfig.token.trim();
      
      const endpoint = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (apiConfig.clientToken && apiConfig.clientToken.trim()) {
        headers['Client-Token'] = apiConfig.clientToken.trim();
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: phoneStr,
          message: text
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro Z-API status ${response.status}`);
      }

      if (data.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      return { success: true };
    } else {
      // Evolution API
      const baseUrl = (apiConfig.apiUrl || '').replace(/\/$/, '');
      if (!baseUrl) {
        return { success: false, error: 'URL da Evolution API não informada.' };
      }
      const endpoint = `${baseUrl}/message/sendText/${apiConfig.instanceId.trim()}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiConfig.token.trim()
        },
        body: JSON.stringify({
          number: phoneStr,
          text: text
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro Evolution API status ${response.status}`);
      }

      return { success: true };
    }
  } catch (err: any) {
    console.error('Erro ao enviar WhatsApp via API:', err);
    return { success: false, error: err.message || 'Falha na conexão com a API' };
  }
}
