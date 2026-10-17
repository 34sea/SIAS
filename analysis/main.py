"""SIAS Analysis API - Serviço de análise de similaridade de monografias.

Endpoints:
  POST /extract-text   Extrai texto de um ficheiro PDF ou Word (DOCX).
  POST /preprocess     Pré-processa texto (remove símbolos, palavras comuns, etc.).
  POST /similarity     Calcula similaridade TF-IDF + Cosseno entre dois textos.
  POST /analyze        Pipeline completo: extrai/pré-processa e compara um texto
                       contra uma base de documentos, devolvendo ranking e trechos.
  GET  /health         Estado do serviço.
"""

import io
import re
import string
import unicodedata
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64
import fitz  # PyMuPDF
import docx  # python-docx

app = FastAPI(
    title="SIAS Analysis API",
    description="Serviço de análise de similaridade de monografias (TF-IDF + Cosseno)",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Palavras comuns (stopwords) em português - usadas no pré-processamento
# ---------------------------------------------------------------------------
STOPWORDS_PT = {
    "a", "o", "os", "as", "um", "uns", "uma", "umas", "e", "ou", "de", "do",
    "dos", "da", "das", "em", "no", "nos", "na", "nas", "por", "para", "com",
    "sem", "sobre", "entre", "até", "após", "antes", "mais", "menos", "que",
    "quem", "qual", "quais", "onde", "quando", "porque", "porquê", "se", "não",
    "sim", "ja", "já", "ainda", "sempre", "nunca", "talvez", "possivelmente",
    "ser", "estar", "ter", "haver", "fazer", "ir", "vir", "dizer", "fazer",
    "isso", "isto", "aquilo", "aqui", "ali", "lá", "cá", "meu", "minha", "seu",
    "sua", "nosso", "nossa", "vosso", "vossa", "seus", "suas", "meus", "minhas",
    "dele", "dela", "deles", "delas", "isto", "esse", "essa", "esses", "essas",
    "aquele", "aquela", "aqueles", "aquelas", "também", "só", "apenas", "mesmo",
    "mesma", "mesmos", "mesmas", "outro", "outra", "outros", "outras", "todo",
    "toda", "todos", "todas", "cada", "qualquer", "algum", "alguma", "alguns",
    "algumas", "nenhum", "nenhuma", "nenhum", "nenhuma", "pouco", "pouca",
    "poucos", "poucas", "muito", "muitos", "muitas", "bem", "mal", "melhor",
    "pior", "maior", "menor", "grande", "pequeno", "novo", "velho", "alta",
    "baixo", "alta", "baixa", "rápido", "rápida", "lento", "lenta",
}

# Modelo para extração via JSON (conteúdo em base64)
class ExtractTextRequest(BaseModel):
    conteudo_base64: str
    filename: str = "documento.pdf"


# Elementos que o administrador pode pedir para ignorar na análise
IGNORE_SECTIONS = [
    "bibliografia", "referências", "referencias", "índice", "indice",
    "sumário", "sumario", "anexos", "anexo", "citações", "citacoes",
    "capa", "cabeçalho", "cabecalho", "rodapé", "rodape",
]


# ===========================================================================
# Utilitários de texto
# ===========================================================================
def limpar_texto(texto: str) -> str:
    """Remove acentos, deixa minúsculo, tira pontuação e espaços extras."""
    if not texto:
        return ""
    # Normaliza acentos (NFKD) e remove caracteres não-ASCII resultantes
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = texto.lower()
    # Substitui pontuação por espaço
    texto = re.sub(f"[{re.escape(string.punctuation)}]", " ", texto)
    # Remove números isolados opcionalmente (mantém alfanumérico misto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def tokenizar(texto: str, remover_stopwords: bool = True) -> List[str]:
    texto = limpar_texto(texto)
    tokens = texto.split()
    if remover_stopwords:
        tokens = [t for t in tokens if t not in STOPWORDS_PT and len(t) > 1]
    return tokens


def ignorar_secoes(texto: str, ignorar: bool = True) -> str:
    """Remove secções como bibliografia, índice, anexos, etc., quando solicitado."""
    if not ignorar or not texto:
        return texto
    linhas = texto.splitlines()
    filtradas = []
    ignorando = False
    for linha in linhas:
        limpa = linha.strip().lower()
        if any(sec in limpa for sec in IGNORE_SECTIONS) and len(limpa) < 60:
            ignorando = True
            continue
        # Para a ignorância quando aparece uma nova secção numerada ou título longo
        if ignorando and re.match(r"^\d+(\.\d+)*\s+[A-Z]", linha.strip()):
            ignorando = False
        if not ignorando:
            filtradas.append(linha)
    return "\n".join(filtradas)


# ===========================================================================
# TF-IDF + Similaridade de Cosseno
# ===========================================================================
def calcular_tfidf(documentos: List[str]) -> List[Dict[str, float]]:
    """Devolve um dicionário {termo: peso_tfidf} para cada documento."""
    tokenizados = [tokenizar(d) for d in documentos]
    # Frequência de termos por documento
    tfs: List[Dict[str, float]] = []
    for tokens in tokenizados:
        total = max(len(tokens), 1)
        tf: Dict[str, float] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        for t in tf:
            tf[t] = tf[t] / total
        tfs.append(tf)

    # Frequência de documentos que contêm o termo
    df: Dict[str, int] = {}
    for tokens in tokenizados:
        for t in set(tokens):
            df[t] = df.get(t, 0) + 1

    n_docs = len(documentos)
    tfidfs: List[Dict[str, float]] = []
    for i, tf in enumerate(tfs):
        tfidf: Dict[str, float] = {}
        for t, v in tf.items():
            idf = __import__("math").log10(n_docs / max(df.get(t, 1), 1)) + 1
            tfidf[t] = v * idf
        tfidfs.append(tfidf)
    return tfidfs


def cosseno(vetor_a: Dict[str, float], vetor_b: Dict[str, float]) -> float:
    """Similaridade de Cosseno entre dois vetores esparsos (dicionários)."""
    interseccao = set(vetor_a.keys()) & set(vetor_b.keys())
    numerador = sum(vetor_a[t] * vetor_b[t] for t in interseccao)
    soma_a = sum(v * v for v in vetor_a.values()) ** 0.5
    soma_b = sum(v * v for v in vetor_b.values()) ** 0.5
    denominador = soma_a * soma_b
    if denominador == 0:
        return 0.0
    return numerador / denominador


def similaridade_textual(texto_a: str, texto_b: str) -> float:
    """Similaridade TF-IDF + Cosseno entre dois textos (0 a 100)."""
    if not texto_a or not texto_b:
        return 0.0
    tfidfs = calcular_tfidf([texto_a, texto_b])
    return cosseno(tfidfs[0], tfidfs[1]) * 100


def encontrar_trechos(
    texto_origem: str,
    texto_comparado: str,
    janela: int = 80,
    limite: int = 5,
) -> List[Dict[str, Any]]:
    """Identifica trechos comuns entre dois textos com base em n-gramas."""
    tokens_o = tokenizar(texto_origem)
    tokens_c = tokenizar(texto_comparado)
    if not tokens_o or not tokens_c:
        return []

    # Conjunto de n-gramas (bigramas/trigramas) do texto comparado
    ngramas_c = set()
    for n in (2, 3):
        for i in range(len(tokens_c) - n + 1):
            ngramas_c.add(" ".join(tokens_c[i : i + n]))

    encontrados: List[Dict[str, Any]] = []
    vistos = set()
    for i in range(len(tokens_o) - 1):
        ngrama = " ".join(tokens_o[i : i + 2])
        if ngrama in ngramas_c and ngrama not in vistos:
            vistos.add(ngrama)
            inicio = max(0, i - janela // 2)
            fim = min(len(tokens_o), i + janela // 2 + 2)
            trecho = " ".join(tokens_o[inicio:fim])
            encontrados.append(
                {
                    "texto": trecho,
                    "posicao_inicio": inicio,
                    "posicao_fim": fim,
                }
            )
            if len(encontrados) >= limite:
                break
    return encontrados


# ===========================================================================
# Extração de texto de ficheiros
# ===========================================================================
def extrair_texto_pdf(conteudo: bytes) -> str:
    texto_partes: List[str] = []
    with fitz.open(stream=conteudo, filetype="pdf") as doc:
        for pagina in doc:
            texto_partes.append(pagina.get_text())
    return "\n".join(texto_partes)


def extrair_texto_docx(conteudo: bytes) -> str:
    ficheiro = io.BytesIO(conteudo)
    d = docx.Document(ficheiro)
    partes: List[str] = []
    for paragrafo in d.paragraphs:
        if paragrafo.text.strip():
            partes.append(paragrafo.text)
    # Tabelas
    for tabela in d.tables:
        for linha in tabela.rows:
            celulas = [c.text.strip() for c in linha.cells]
            partes.append(" | ".join(celulas))
    return "\n".join(partes)


# ===========================================================================
# Endpoints
# ===========================================================================
@app.get("/")
def root():
    return {"message": "SIAS Analysis API running"}


@app.get("/health")
def health():
    return {"status": "ok"}

# import base64
# import json
# from typing import Optional

# from fastapi import File, HTTPException, Request, UploadFile


@app.post("/extract-text")
async def extract_text(
    request: Request,
    file: Optional[UploadFile] = File(None),
):
    """Extrai texto de PDF ou Word via multipart ou JSON base64."""

    conteudo: Optional[bytes] = None
    nome = "documento"

    if file is not None:
        conteudo = await file.read()
        nome = file.filename or "documento"

    else:
        try:
            body = await request.json()
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Envie um ficheiro ou um JSON válido com conteudo_base64."
            )

        conteudo_base64 = body.get("conteudo_base64")

        if not conteudo_base64:
            raise HTTPException(
                status_code=400,
                detail="Envie um ficheiro ou conteudo_base64."
            )

        try:
            conteudo = base64.b64decode(
                conteudo_base64,
                validate=True
            )
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="conteudo_base64 inválido."
            )

        nome = body.get("filename") or "documento"

    if not conteudo:
        raise HTTPException(
            status_code=400,
            detail="O ficheiro enviado está vazio."
        )

    nome_lower = nome.lower()

    try:
        if nome_lower.endswith(".pdf"):
            texto = extrair_texto_pdf(conteudo)
        elif nome_lower.endswith(".docx"):
            texto = extrair_texto_docx(conteudo)
        elif nome_lower.endswith(".doc"):
            raise HTTPException(
                status_code=400,
                detail="O formato DOC antigo não é suportado pelo extrator actual. Converta o ficheiro para DOCX ou PDF."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Formato não suportado. Envie PDF ou DOCX."
            )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao extrair texto: {str(exc)}"
        )

    return {
        "sucesso": True,
        "texto": texto,
        "tamanho": len(texto),
        "palavras": len(texto.split()),
    }


@app.post("/preprocess")
def preprocess(payload: Dict[str, Any]):
    """Pré-processa um texto: limpa, remove stopwords e secções ignoradas."""
    texto = payload.get("texto", "")
    ignorar = bool(payload.get("ignorar_secicoes", True))
    if not texto:
        raise HTTPException(status_code=400, detail="O campo 'texto' é obrigatório.")
    texto_limpo = ignorar_secoes(texto, ignorar)
    texto_processado = " ".join(tokenizar(texto_limpo))
    return {
        "sucesso": True,
        "texto_original": texto,
        "texto_processado": texto_processado,
        "tamanho_original": len(texto),
        "tamanho_processado": len(texto_processado),
        "palavras": len(texto_processado.split()),
    }


@app.post("/similarity")
def similarity(payload: Dict[str, Any]):
    """Calcula similaridade TF-IDF + Cosseno entre dois textos."""
    texto_a = payload.get("texto_a", "")
    texto_b = payload.get("texto_b", "")
    if not texto_a or not texto_b:
        raise HTTPException(
            status_code=400, detail="Os campos 'texto_a' e 'texto_b' são obrigatórios."
        )
    percentual = similaridade_textual(texto_a, texto_b)
    return {
        "sucesso": True,
        "similaridade": round(percentual, 2),
        "metodo": "TF-IDF + Cosseno",
    }


@app.post("/analyze")
def analyze(payload: Dict[str, Any]):
    """Compara um texto contra uma base de documentos e devolve ranking + trechos."""
    texto_origem = payload.get("texto_origem", "")
    documentos = payload.get("documentos", [])
    config = payload.get("config", {}) or {}
    similaridade_minima = float(config.get("similaridade_minima", 10))
    limite_documentos = int(config.get("limite_documentos", 10))
    ignorar_secicoes = bool(config.get("ignorar_secicoes", True))

    if not texto_origem:
        raise HTTPException(status_code=400, detail="O campo 'texto_origem' é obrigatório.")
    if not documentos:
        raise HTTPException(
            status_code=400, detail="A lista 'documentos' não pode estar vazia."
        )

    origem_processada = " ".join(tokenizar(ignorar_secoes(texto_origem, ignorar_secicoes)))

    resultados: List[Dict[str, Any]] = []
    for doc in documentos:
        doc_id = doc.get("id")
        doc_texto = doc.get("texto", "")
        if not doc_texto:
            continue
        doc_processado = " ".join(tokenizar(ignorar_secoes(doc_texto, ignorar_secicoes)))
        perc = similaridade_textual(origem_processada, doc_processado)
        if perc < similaridade_minima:
            continue
        trechos = encontrar_trechos(texto_origem, doc_texto)
        resultados.append(
            {
                "documento_id": doc_id,
                "percentual_similaridade": round(perc, 2),
                "quantidade_trechos": len(trechos),
                "trechos": trechos,
            }
        )

    # Ordena por similaridade decrescente (ranking)
    resultados.sort(key=lambda r: r["percentual_similaridade"], reverse=True)
    for posicao, r in enumerate(resultados[:limite_documentos], start=1):
        r["posicao_ranking"] = posicao
    resultados = resultados[:limite_documentos]

    similaridade_geral = (
        round(sum(r["percentual_similaridade"] for r in resultados) / len(resultados), 2)
        if resultados
        else 0.0
    )

    # Classificação com base na similaridade geral
    if similaridade_geral > 50:
        classificacao = "Muito elevada"
    elif similaridade_geral > 30:
        classificacao = "Elevada"
    elif similaridade_geral > 15:
        classificacao = "Moderada"
    else:
        classificacao = "Baixa"

    return {
        "sucesso": True,
        "similaridade_geral": similaridade_geral,
        "classificacao": classificacao,
        "metodo": "TF-IDF + Cosseno",
        "total_documentos_comparados": len(documentos),
        "total_semelhantes": len(resultados),
        "resultados": resultados,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
