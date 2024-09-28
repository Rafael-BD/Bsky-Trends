# Bluesky Trending Topics

## Descrição

Este projeto extrai tendências de postagens em tempo real e as armazena em um banco de dados. O projeto utiliza técnicas de processamento de linguagem natural para analisar as postagens e extrair tendências. As tendências são armazenadas no Supabase para consultas posteriores.

## Tecnologias Utilizadas

- **Supabase**: Banco de dados para armazenar as tendências.
- **Compromise**: Biblioteca de PLN para processamento de texto.
- **Google Gemini**: API de IA generativa para classificar tópicos.
<!-- - **Web Workers**: Para processamento paralelo de postagens. -->

## Funcionalidades

- **Extração de N-grams**: Extração de palavras, frases e hashtags das postagens.
- **Filtragem de Conteúdo**: Filtragem de stopwords, palavras da lista negra e conteúdo irrelevante.
- **Classificação de Texto**: Classificação de tópicos usando um classificador de texto.
- **Armazenamento de Tendências**: Armazenamento de tendências no Supabase.
<!-- - **Processamento Paralelo**: Usando um pool de trabalhadores para processamento paralelo de postagens. -->

## Requisitos

- **Node.js**: Instale o [Node.js](https://nodejs.org/) para executar o projeto.
- **Supabase (opcional)**: Configure uma conta no [Supabase](https://supabase.com/) e obtenha as credenciais necessárias.
- **Chave de API do Google Gemini (opcional)**: Configure uma conta no [Google Cloud](https://cloud.google.com/) e crie um projeto com a _API de Linguagem Generativa (API Gemini)_ habilitada e obtenha a chave da API em https://aistudio.google.com/app/apikey.

O uso do **Supabase** é opcional e o **Google Gemini** é usado apenas para classificar tópicos. Você pode substituir esses serviços por outros de sua escolha.

## Instalação

1. Clone o repositório:

    ```sh
    git clone https://github.com/Rafael-BD/Bsky-Trends
    cd Bsky-Trends
    ```

2. Configure as variáveis de ambiente no arquivo `.env`:

    ```sh
    SUPABASE_URL=seu_url_supabase
    SVC_KEY=sua_chave_supabase
    GOOGLE_API_KEY=sua_chave_api_google
    DEV=true # Defina como false em produção
    ```

3. Crie uma tabela Supabase chamada `trends` com as seguintes colunas:

    - `id`
    - `trend` (jsonb)
    - `lang` (text)
    - `updated_at` (TIMESTAMPZ)

4. Crie um bucket de Armazenamento Supabase chamado `checkpoints` para armazenar os pontos de verificação das tendências que são usados pelo servidor para recuperar as tendências em caso de reinicialização.

## Uso

1. Instale as dependências:

    ```sh
    npm install
    ```
    ou
    ```sh
    bun install
    ```

2. Inicie o cliente WebSocket para ouvir as postagens:

    ```sh
    npm run start
    ```
    ou
    ```sh
    bun server.ts
    ```

    Agora faça solicitações GET para `http://localhost:8003/trending` para obter as tendências.

## Explicação das Funcionalidades

### Extração de N-grams

O projeto extrai palavras, frases e hashtags das postagens usando técnicas de PLN. A extração é feita através das funções `extractWords`, `extractSentences` e `extractHashtags`.

### Filtragem de Conteúdo

O conteúdo extraído é filtrado para remover stopwords, palavras da lista negra e conteúdo irrelevante. A filtragem é feita através das funções `filterWords` e `filterSentences`.

### Classificação de Texto

Os tópicos extraídos são classificados usando a IA Google Gemini. A classificação é feita através da função `classifyText`.

### Armazenamento de Tendências

As tendências são armazenadas no Supabase. O armazenamento é feito através do arquivo `services/saveTrends.ts`.

<!-- ### Processamento Paralelo

O projeto usa um pool de trabalhadores para processar postagens de forma eficiente. O pool de trabalhadores é implementado no arquivo `workerPool.ts`. -->

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

