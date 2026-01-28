import { Client } from "@notionhq/client";
import fetch from "node-fetch";

// ================= CONFIG =================
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const CHANNELS = [
  { name: "GeoBrasil", id: "UC2zV1b5ZqW7wR3QX8XbX1Xg" },
  { name: "Gabarita Geo", id: "UCq9y9n9n9n9n9n9n9n9" },
  { name: "Terra Negra", id: "UC9Xy9y9y9y9y9y9y9y" },
  { name: "Professor Ricardo Marcílio", id: "UCkXkXkXkXkXkXkXkXk" }
];

// ================= NOTION =================
const notion = new Client({ auth: NOTION_TOKEN });

// ================= FUNÇÕES =================
async function getLatestVideos(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=3&type=video&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

async function addVideoToNotion(video, channelName) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

  await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      "Título": {
        title: [{ text: { content: video.snippet.title } }]
      },
      "Canal": {
        rich_text: [{ text: { content: channelName } }]
      },
      "URL": {
        url: videoUrl
      },
      "Publicado em": {
        date: { start: video.snippet.publishedAt }
      }
    }
  });
}

// ================= MAIN =================
async function main() {
  for (const channel of CHANNELS) {
    const videos = await getLatestVideos(channel.id);
    for (const video of videos) {
      await addVideoToNotion(video, channel.name);
    }
  }
}

main().catch(console.error);
