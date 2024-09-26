# Bluesky Trending Topics

## Descrição

Este é um projeto que extrai tendências de posts em tempo real e as armazena em um banco de dados. O projeto utiliza técnicas de processamento de linguagem natural para analisar os posts e extrair as tendências. As tendências são armazenadas no Supabase para posterior consulta.

## Tecnologias Utilizadas

- **Deno**: Runtime para JavaScript e TypeScript.
- **Supabase**: Banco de dados para armazenar as tendências.
- **Compromise**: Biblioteca de NLP para processamento de texto.
- **Google Gemini**: API de IA generativa para classificar os tópicos.
<!-- - **Web Workers**: Para processamento paralelo dos posts. -->

## Funcionalidades

- **Extração de N-grams**: Extração de palavras, frases e hashtags dos posts.
- **Filtragem de Conteúdo**: Filtragem de stopwords, palavras na blacklist e conteúdo irrelevante.
- **Classificação de Texto**: Classificação de tópicos utilizando um classificador de texto.
- **Armazenamento de Tendências**: Armazenamento das tendências no Supabase.
<!-- - **Processamento Paralelo**: Utilização de um pool de workers para processamento paralelo dos posts. -->

## Requisitos

- **Deno**: Certifique-se de ter o Deno instalado. Você pode instalar o Deno seguindo as instruções [aqui](https://docs.deno.com/runtime/).
- **Supabase**: Configure uma conta no [Supabase](https://supabase.com/) e obtenha as credenciais necessárias.
- **Google Gemini API Key**: Configure uma conta no [Google Cloud](https://cloud.google.com/) e crie um projeto com a API _Generative Language API_ habilitada e obtenha a chave de API.

O uso do **Supabase** é opcional e o **Google Gemini** é utilizado apenas para classificar os tópicos. Você pode substituir esses serviços por outros de sua preferência.

## Instalação

1. Clone o repositório:

    ```sh
    git clone https://github.com/Rafael-BD/Bsky-Trends
    cd Bsky-Trends
    ```

2. Configure as variáveis de ambiente no arquivo `.env`:

    ```sh
    SUPABASE_URL=your_supabase_url
    SVC_KEY=your_supabase_key
    GOOGLE_API_KEY=your_google_api_key
    ```

## Uso

1. Inicie o WebSocket client para ouvir os posts:

    ```sh
    deno run dev 
    ```

2. Para obter as tendências atuais, remova o comentário da linha 3 no arquivo `server.ts` para iniciar o servidor HTTP:
    ```ts
    // const app = new Application();

    // const router = new Router();

    // router.get("/trending", async (ctx) => {
    //     const trends = await getTrendingTopics(20, 'pt');
    //     ctx.response.body = trends;
    // });


    // // Middleware e rotas
    // app.use(oakCors({ origin: "*" }));
    // app.use(router.routes());
    // app.use(router.allowedMethods());

    // console.log("App Operations Backend running on http://localhost:8003");

    // // Função para rodar o servidor HTTP
    // async function startHttpServer() {
    //     await app.listen({ port: 8003 });
    // }
    ```
    Agora faça requisições GET para `http://localhost:8003/trending` para obter as tendências.

## Explicação das Features

### Extração de N-grams

O projeto extrai palavras, frases e hashtags dos posts utilizando técnicas de NLP. A extração é feita através das funções `extractWords`, `extractSentences` e `extractHashtags`.

### Filtragem de Conteúdo

O conteúdo extraído é filtrado para remover stopwords, palavras na blacklist e conteúdo irrelevante. A filtragem é feita através das funções `filterWords` e `filterSentences`.

### Classificação de Texto

Os tópicos extraídos são classificados utilizando a IA do Google Gemini. A classificação é feita através da função `classifyText`.

### Armazenamento de Tendências

As tendências são armazenadas no Supabase. O armazenamento é feito através da função `saveTrend`.

<!-- ### Processamento Paralelo

O projeto utiliza um pool de workers para processar os posts de forma eficiente. O pool de workers é implementado no arquivo `workerPool.ts`. -->

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
