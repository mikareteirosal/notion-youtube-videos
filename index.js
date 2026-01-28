/notion-youtube
 ├── index.js
 ├── package.json
 └── .github/workflows/update.yml
name: Atualizar vídeos do YouTube
import fetch from "node-fetch";
import FeedParser from "feedparser-promised";

// ==========================
// VARIÁVEIS DE AMBIENTE
// (NÃO coloque tokens aqui)
// ==========================
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

// ==========================
// CANAIS DO YOUTUBE
// ==========================
const CANAIS = [
  { nome: "GeoBrasil", url: "https://www.youtube.com/@Geobrasil/videos" },
  { nome: "GabaritaGeo", url: "https://www.youtube.com/@gabaritageo/videos" },
  { nome: "Terra Negra", url: "https://www.youtube.com/@TerraNegra/videos" },
  { nome: "Prof. Ricardo Marcílio", url: "https://www.youtube.com/c/ProfessorRicardoMarc%C3%ADlio/videos" }
];

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28"
};

// ==========================
// BUSCAR CHANNEL ID
// ==========================
async function getChannelId(channelUrl) {
  const res = await fetch(channelUrl);
  const html = await res.text();

  const match = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
  if (!match) throw new Error("Channel ID não encontrado");

  return match[1];
}

// ==========================
// VERIFICAR SE VÍDEO JÁ EXISTE
// ==========================
async function videoExiste(videoUrl) {
  const body = {
    filter: {
      property: "URL",
      url: { equals: videoUrl }
    }
  };

  const res = await fetch(
    `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(body)
    }
  );

  const data = await res.json();
  return data.results.length > 0;
}

// ==========================
// ENVIAR PARA O NOTION
// ==========================
async function enviarParaNotion({ titulo, canal, url, publicado, thumb }) {
  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      "Título": {
        title: [{ text: { content: titulo } }]
      },
      "Canal": {
        select: { name: canal }
      },
      "URL": {
        url: url
      },
      "Publicado em": {
        date: { start: publicado }
      },
      "Visto": {
        checkbox: false
      },
      "Thumbnail": {
        files: [
          {
            type: "external",
            name: "thumb",
            external: { url: thumb }
          }
        ]
      }
    }
  };

  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify(payload)
  });
}

// ==========================
// EXECUÇÃO PRINCIPAL
// ==========================
(async () => {
  console.log("🚀 Iniciando verificação de vídeos...");

  for (const canal of CANAIS) {
    console.log(`🔍 Canal: ${canal.nome}`);

    const channelId = await getChannelId(canal.url);
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const videos = await FeedParser.parse(feedUrl);

    for (const video of videos.slice(0, 5)) {
      const videoUrl = video.link;
      const jaExiste = await videoExiste(videoUrl);

      if (jaExiste) continue;

      const videoId = videoUrl.split("v=")[1];
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      await enviarParaNotion({
        titulo: video.title,
        canal: canal.nome,
        url: videoUrl,
        publicado: video.pubdate.toISOString(),
        thumb
      });

      console.log(`✅ Novo vídeo adicionado: ${video.title}`);
    }
  }

  console.log("🎉 Processo finalizado com sucesso!");
})();
