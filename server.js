import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// A Hostinger injeta a porta necessária via process.env.PORT
const PORT = process.env.PORT || 3000;

app.post('/api/bb-pix', async (req, res) => {
  try {
    const { amount, bbPixConfig, txid } = req.body;
    
    if (!bbPixConfig || !bbPixConfig.enabled || (!bbPixConfig.clientId && !bbPixConfig.clientSecret)) {
      return res.status(400).json({ error: 'Configuração do Banco do Brasil não definida ou incompleta.' });
    }

    const { clientId, clientSecret, developerAppKey, isProduction } = bbPixConfig;
    const authUrl = isProduction ? 'https://oauth.bb.com.br/oauth/token' : 'https://oauth.sandbox.bb.com.br/oauth/token';
    const baseUrl = isProduction ? 'https://api.bb.com.br/pix/v2' : 'https://api.sandbox.bb.com.br/pix/v2';
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Obter Token
    const tokenRes = await fetch(authUrl + '?gw-app-key=' + developerAppKey, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=cob.write cob.read pix.read'
    });
    
    if (!tokenRes.ok) {
      console.error('BB Token erro:', await tokenRes.text());
      return res.status(tokenRes.status).json({ error: 'Erro ao autenticar com Banco do Brasil.' });
    }
    
    const { access_token } = await tokenRes.json();
    
    // Gerar Cobrança (cob)
    const cobBody = {
      calendario: { expiracao: 3600 },
      valor: { original: amount.toFixed(2) },
      chave: "Sua_Chave_Pix_Aqui", // Na API Sandbox do BB pode ser um email ou aleatória válida
      solicitacaoPagador: "Pedido Delivery"
    };

    const cobRes = await fetch(`${baseUrl}/cob/${txid || ''}?gw-app-key=${developerAppKey}`, {
      method: txid ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cobBody)
    });

    if (!cobRes.ok) {
      console.error('BB Cob erro:', await cobRes.text());
      return res.status(cobRes.status).json({ error: 'Erro ao criar cobrança PIX no Banco do Brasil.' });
    }

    const cobData = await cobRes.json();
    
    // Para simplificar no MVP/Sandbox e evitar problemas com mTLS, vamos retornar o EMV (BRCode)
    return res.json({ 
      txid: cobData.txid, 
      brcode: cobData.pixCopiaECola || cobData.location || "000201010211...", // Placeholder fallback for sandbox
      status: cobData.status 
    });

  } catch (error) {
    console.error('Erro na API BB Pix:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao gerar PIX do BB.' });
  }
});

app.post('/api/infinitepay-checkout', async (req, res) => {
  try {
    const { amount, infinitePayConfig, items, redirectUrl } = req.body;

    if (!infinitePayConfig || !infinitePayConfig.enabled || !infinitePayConfig.infiniteTag) {
      return res.status(400).json({ error: 'Configuração do InfinitePay não definida ou incompleta no painel.' });
    }

    const { infiniteTag, clientId, clientSecret } = infinitePayConfig;
    const cleanTag = (infiniteTag || '').replace(/^\$/, '').trim();

    if (!cleanTag) {
      return res.status(400).json({ error: 'InfiniteTag não informada ou inválida.' });
    }

    // Cabeçalhos padrão
    const headers = {
      'Content-Type': 'application/json',
    };

    // Autenticação Opcional Oauth Client Credentials
    if (clientId && clientSecret && clientId.trim() && clientSecret.trim()) {
      try {
        const authRes = await fetch('https://api.infinitepay.io/v1/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId.trim(),
            client_secret: clientSecret.trim(),
            grant_type: 'client_credentials'
          })
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.access_token) {
            headers['Authorization'] = `Bearer ${authData.access_token}`;
          }
        }
      } catch (err) {
        console.error('Erro ao obter token InfinitePay, tentando sem autenticação:', err);
      }
    }

    // Preparar os itens convertendo os valores de Real para Centavos (inteiros)
    let formattedItems = [];
    const targetAmountCents = Math.round(Number(amount) * 100);

    let itemsSum = 0;
    const mappedItems = (items && items.length > 0) ? items.map(item => {
      const p = Math.round(Number(item.price) * 100);
      const q = Number(item.quantity) || 1;
      itemsSum += p * q;
      return {
        quantity: q,
        price: p,
        description: item.name || item.description || 'Item do Pedido'
      };
    }) : [];

    const diff = targetAmountCents - itemsSum;

    if (mappedItems.length > 0 && diff >= 0) {
      formattedItems = [...mappedItems];
      if (diff > 0) {
        formattedItems.push({
          quantity: 1,
          price: diff,
          description: 'Taxa de Entrega / Adicionais'
        });
      }
    } else {
      // Se não houver itens ou se houver desconto (diff < 0), consolidamos tudo em um único item com o valor final correto
      formattedItems = [
        {
          quantity: 1,
          price: targetAmountCents,
          description: 'Pedido Pastelaria (Total)'
        }
      ];
    }

    const payload = {
      handle: cleanTag,
      redirect_url: redirectUrl || 'https://google.com',
      items: formattedItems
    };

    console.log('Solicitando link InfinitePay com payload:', JSON.stringify(payload));

    const apiRes = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await apiRes.text();
    console.log(`InfinitePay API Status: ${apiRes.status}, Response: ${responseText}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    if (!apiRes.ok) {
      console.error('InfinitePay Link API Error:', responseText);
      return res.status(apiRes.status).json({ 
        error: 'Erro ao gerar link de pagamento na InfinitePay.', 
        details: responseText,
        status: apiRes.status 
      });
    }

    const finalUrl = data.url || data.checkout_url || data.payment_url || data.link || data.checkoutUrl || (data.data && (data.data.url || data.data.checkout_url));
    
    return res.json({
      ...data,
      url: finalUrl
    });

  } catch (error) {
    console.error('Erro na API InfinitePay:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao gerar link da InfinitePay.' });
  }
});

app.post('/api/bb-pix-status', async (req, res) => {
  try {
    const { txid, bbPixConfig } = req.body;
    
    if (!bbPixConfig || !bbPixConfig.enabled || (!bbPixConfig.clientId && !bbPixConfig.clientSecret)) {
      return res.status(400).json({ error: 'Configuração do Banco do Brasil não definida.' });
    }

    const { clientId, clientSecret, developerAppKey, isProduction } = bbPixConfig;
    const authUrl = isProduction ? 'https://oauth.bb.com.br/oauth/token' : 'https://oauth.sandbox.bb.com.br/oauth/token';
    const baseUrl = isProduction ? 'https://api.bb.com.br/pix/v2' : 'https://api.sandbox.bb.com.br/pix/v2';
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenRes = await fetch(authUrl + '?gw-app-key=' + developerAppKey, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=cob.read pix.read'
    });
    
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: 'Erro ao autenticar com Banco do Brasil.' });
    }
    
    const { access_token } = await tokenRes.json();
    
    const cobRes = await fetch(`${baseUrl}/cob/${txid}?gw-app-key=${developerAppKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!cobRes.ok) {
      return res.status(cobRes.status).json({ error: 'Erro ao obter status do PIX.' });
    }

    const cobData = await cobRes.json();
    return res.json({ status: cobData.status }); // "ATIVA" or "CONCLUIDA"
  } catch (error) {
    console.error('Erro get PIX status:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao consultar PIX.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'development') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir os arquivos estáticos da compilação do React (pasta 'dist')
    app.use(express.static(join(__dirname, 'dist')));

    // Redirecionar todas as outras requisições para o index.html (para o React Router funcionar)
    app.get('*all', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  }

  // A Hostinger requer que a aplicação escute nesta porta
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
