# Face/Object Detection Dashboard web

## Descrição do Projeto

Esta é a **Dashboard Web** para o projeto de detecção de objetos/rostos em tempo real, utilizando **Vue.js 3** e **Tailwind CSS**. O painel permite:

- Monitorar a câmera em tempo real via stream MJPEG.
- Capturar snapshots com objetos detectados pelo backend (Python + YOLO).
- Visualizar dados de detecção em JSON.
- Controlar a câmera com botões (iniciar, parar, detectar).
- Servir como base para integração de **cards e gráficos** com métricas do sistema.

O frontend consome a **API FastAPI** do backend para obter imagens e informações de detecção.

## Tecnologias Utilizadas

- **Frontend:** Vue.js 3, Tailwind CSS
- **Comunicação:** HTTP/REST para consumir API do backend
- **Estilização:** Tailwind CSS para design moderno e responsivo

## Requisitos

- Node.js 18+ e npm ou yarn
- Backend do projeto rodando (FastAPI + OpenCV + YOLO) em `localhost:8000`

## Instalação e Configuração

### 1. Clonar o projeto

```bash
git clone https://github.com/34sea/sistema-de-reconhecimento-facial-dashboard.git
cd sistema-de-reconhecimento-facial-dashboard
```

### 2. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 3. Executar o servidor de desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

### 4. Acessar no navegador

```
http://localhost:5173
```

- A dashboard estará visível, mostrando o painel de **Monitoramento** com botões e área de visualização.

## Integração com Backend

Certifique-se que o **backend (FastAPI + YOLO)** está rodando em `http://localhost:8000`. A dashboard utiliza os seguintes endpoints:

| Função                   | Endpoint da API      |
|--------------------------|-------------------|
| Iniciar Câmera           | `/start`          |
| Parar Câmera             | `/stop`           |
| Capturar Snapshot        | `/snapshot`       |
| Detectar Objetos         | `/detect`         |
| Ver Stream                | `/stream`         |

Se o frontend estiver em uma porta diferente do backend, é recomendado configurar **CORS** no backend.

## Para o Uso

- Clique em **Iniciar Câmera** antes de tentar capturar ou detectar objetos.
- Use **Capturar Snapshot** para gerar imagens com caixas desenhadas.
- Use **Detectar Objetos** para obter JSON com dados das detecções.
- Clique em **Ver Stream** para abrir o vídeo ao vivo em uma nova aba.


## Observações

- O frontend depende do backend para funcionalidade completa.

