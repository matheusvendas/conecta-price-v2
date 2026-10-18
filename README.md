# 💸 Conecta Price V2 (Pricing Inteligente)

Um sistema avançado de precificação para e-commerce e varejo, movido a Inteligência Artificial e dados de mercado em tempo real. Este projeto utiliza uma **Arquitetura API-First** totalmente desacoplada, permitindo que a inteligência de negócios seja consumida por múltiplos frontends (Next.js, Streamlit, Mobile, etc).

## 🚀 Principais Funcionalidades

1. **Pesquisa de Mercado Inteligente:**
   - Varredura em tempo real no Google Shopping via **Serper API**.
   - **LLM Batch Curator:** Utiliza IA (Chain of Thought via Groq/OpenAI) para filtrar "sujeiras" comuns de varejo, como kits de atacado, produtos similares de marcas erradas ou gramaturas diferentes.
   - Opção de busca Rápida (Dados brutos) ou Inteligente (Filtro Semântico IA).
   
2. **Motor Financeiro (Pricing Engine):**
   - Cálculo reverso para garantir a Margem de Lucro Alvo.
   - Aplicação de Custos Fixos, Frete e Comissões de Marketplace.
   - **Fator EVE (Estratégia de Valor e Escassez):** Posicionamento dinâmico que vai desde o Giro Agressivo (Queima de Estoque) até Vantagem Tática em Leilões de Buy Box, ou Prêmio de Serviço.
   - "Voo Cego": Precificação matemática baseada puramente em custos quando não há âncora de mercado.

3. **Múltiplas Interfaces:**
   - **Frontend V2:** Uma aplicação moderna em Next.js (React) com Tailwind CSS e persistência de histórico via Supabase.
   - **Frontend V1:** Uma interface clássica e rápida em Streamlit focada em cálculos pontuais, consumindo a mesma API (Backend V2).

## 🛠️ Tecnologias Utilizadas

### Backend (Cérebro)
* **Python & FastAPI:** Motor de alta performance assíncrono.
* **Groq / OpenRouter:** Provedores de LLM para curadoria de dados de mercado.
* **Serper API:** Raspagem de dados do Google Shopping.
* **Loguru:** Rastreamento e logs detalhados do pipeline de dados.

### Frontend (Interfaces)
* **Next.js & React:** Interface rica, responsiva e dinâmica.
* **Tailwind CSS:** Estilização utility-first (Design System).
* **Supabase:** Backend-as-a-Service para persistência do histórico de buscas no Banco de Dados PostgreSQL (Autenticação e DB).
* **Streamlit:** Interface legacy em Python perfeitamente acoplada ao novo backend via `requests`.

---

## ⚙️ Como Executar Localmente

### 1. Preparação (Variáveis de Ambiente)
Crie arquivos `.env` nas respectivas pastas e preencha com suas chaves reais (estas pastas já estão protegidas no `.gitignore`):

**Backend (`backend/.env`)**
```env
GROQ_API_KEY=sua_chave_groq
SERPER_API_KEY=sua_chave_serper
```

**Frontend Next.js (`frontend/.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 2. Rodando o Motor (Backend)
No seu terminal principal, ative o ambiente virtual e rode o FastAPI:
```bash
cd backend
pip install -r requirements.txt
fastapi dev app/main.py
```
O servidor estará rodando em `http://localhost:8000`. Você pode ver a documentação interativa da API em `http://localhost:8000/docs`.

---

### 3. Rodando as Interfaces (Frontends)

Você pode escolher qual "carcaça" rodar (ou até rodar as duas juntas!):

#### Opção A: Frontend Next.js (Principal)
Abra um novo terminal e rode:
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:3000` no navegador.

#### Opção B: Frontend Streamlit (Clássico)
Abra um novo terminal (certifique-se de que o ambiente virtual Python está ativo) e rode:
```bash
pip install streamlit requests
streamlit run streamlit/app.py
```
O navegador abrirá automaticamente a interface do Streamlit conectada à sua API.

---

## 🔒 Segurança
O projeto já conta com um `.gitignore` rigoroso que bloqueia qualquer upload acidental de arquivos `.env` ou artefatos de build para proteger suas chaves de API contra vazamentos.

## 📝 Licença
Distribuído sob a licença GNU. Veja o arquivo `LICENSE` para mais detalhes.
