const axios = require('axios');

/**
 * Serviço de ligação ao container de análise (Python / FastAPI).
 * Toda a comunicação com o motor de similaridade passa por aqui.
 *
 * Nota: o envio de ficheiros é feito como base64 em JSON para evitar
 * dependências adicionais (ex. form-data) no backend Node.js.
 */
const PYTHON_BASE_URL = 'http://python_analysis:8000';
// const PYTHON_BASE_URL = process.env.PYTHON_API_URL || 'http://python_analysis:8000';

const client = axios.create({
    baseURL: PYTHON_BASE_URL,
    timeout: parseInt(process.env.PYTHON_TIMEOUT || '120000', 10),
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Extrai texto de um ficheiro PDF ou Word enviado ao serviço Python.
 * O conteúdo do ficheiro é enviado como base64 no corpo JSON.
 * @param {Buffer} buffer - Conteúdo binário do ficheiro.
 * @param {string} filename - Nome do ficheiro (para detetar a extensão).
 * @returns {Promise<{texto: string, tamanho: number, palavras: number}>}
 */
async function extrairTexto(buffer, filename) {
    const conteudoBase64 = buffer.toString('base64');
    const response = await client.post('/extract-text', {
        conteudo_base64: conteudoBase64,
        filename,
    });
    return response.data;
}

/**
 * Pré-processa um texto no serviço Python (limpeza, stopwords, secções ignoradas).
 * @param {string} texto
 * @param {object} opcoes - { ignorar_secicoes: boolean }
 * @returns {Promise<{texto_processado: string, ...}>}
 */
async function preprocessarTexto(texto, opcoes = {}) {
    const response = await client.post('/preprocess', {
        texto,
        ignorar_secicoes: opcoes.ignorar_secicoes !== false,
    });
    return response.data;
}

/**
 * Calcula a similaridade TF-IDF + Cosseno entre dois textos.
 * @param {string} textoA
 * @param {string} textoB
 * @returns {Promise<{similaridade: number, metodo: string}>}
 */
async function calcularSimilaridade(textoA, textoB) {
    const response = await client.post('/similarity', {
        texto_a: textoA,
        texto_b: textoB,
    });
    return response.data;
}

/**
 * Executa a análise completa de similaridade de um texto contra uma base documental.
 * @param {object} payload
 *   { texto_origem, documentos: [{id, texto}], config: {...} }
 * @returns {Promise<{similaridade_geral, classificacao, resultados: [...] }>}
 */

async function analisarSimilaridade(payload) {
    try {
        console.log('A chamar Python:', `${PYTHON_BASE_URL}/analyze`);
        console.log('Tamanho do texto de origem:', payload.texto_origem?.length ?? 0);
        console.log('Quantidade de documentos:', payload.documentos?.length ?? 0);
        console.log('Configuração:', payload.config);

        const response = await client.post('/analyze', payload);
        return response.data;
    } catch (error) {
        console.error('Erro na análise Python:');
        console.error('Status:', error.response?.status);
        console.error(
            'Resposta do Python:',
            JSON.stringify(error.response?.data, null, 2)
        );
        throw error;
    }
}

// async function analisarSimilaridade(payload) {
//     const response = await client.post('/analyze', payload);
//     return response.data;
// }

/**
 * Verifica se o serviço de análise está disponível.
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
    try {
        await client.get('/health');
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    extrairTexto,
    preprocessarTexto,
    calcularSimilaridade,
    analisarSimilaridade,
    healthCheck,
    PYTHON_BASE_URL,
};
