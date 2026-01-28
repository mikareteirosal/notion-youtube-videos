import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.DATABASE_ID;

async function testNotion() {
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      "Título": {
        title: [{ text: { content: "TESTE OK" } }]
      },
      "Canal": {
        rich_text: [{ text: { content: "GitHub Actions" } }]
      },
      "URL": {
        url: "https://github.com"
      },
      "Publicado em": {
        date: { start: new Date().toISOString() }
      }
    }
  });
}

testNotion().catch(console.error);
