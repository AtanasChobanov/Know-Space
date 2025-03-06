import axios from "axios";
import { sanitizeHTML } from "./sanitize.js";

async function getWikipediaArticleIntro(pageTitle) {
    try {
      const url = `https://bg.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=true&format=json&origin=*`;
      const response = await axios.get(url);
      
      const pages = response.data.query.pages;
      const page = Object.values(pages)[0]; // Взимаме първата статия
      return page?.extract || "Няма налично описание.";
    } catch (err) {
      console.error("Error fetching Wikipedia intro:", err);
      return "Грешка при зареждане на описанието.";
    }
}

export async function fetchWikipediaImages(pageTitle) {
  try {
    const url = `https://bg.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&origin=*`;
    const response = await axios.get(url);

    const pages = response.data.query.pages;
    const page = Object.values(pages)[0];
    if (!page?.images) return [];

    // Взимаме до 5 заглавия на изображения
    const imageTitles = page.images.map(img => img.title).slice(0, 5);

    // Генерираме URL за всяко изображение
    const imageUrls = await Promise.all(imageTitles.map(async (title) => {
      try {
        const imageInfoUrl = `https://bg.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
        const imgResponse = await axios.get(imageInfoUrl);

        const imagePage = Object.values(imgResponse.data.query.pages)[0];
        return imagePage?.imageinfo?.[0]?.url || null;
      } catch (err) {
        console.error(`Error fetching image URL for ${title}:`, err);
        return null;
      }
    }));

    // Filter out `null` values
    return imageUrls.filter(url => url);
  } catch (err) {
    console.error("Error fetching Wikipedia images:", err);
    return [];
  }
}

export async function fetchWikipediaArticles(searchedItem) {
    try {
        const url = `https://bg.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchedItem)}&format=json&origin=*`;
        const response = await axios.get(url);

        if (!response.data?.query?.search) return [];

        return Promise.all(response.data.query.search.map(async (item) => {
            const postId = `wiki-${item.pageid}`;
            const externalUrl = `https://bg.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`;

            // Get the beginning of the Wikipedia article
            const introText = await getWikipediaArticleIntro(item.title);
            const contentWithLink = `${introText}<p>... <a href="${externalUrl}" target="_blank">Прочети повече в Wikipedia</a></p>`;
            const sanitizedContent = sanitizeHTML(contentWithLink);

            return {
              postId,
              title: item.title,
              content: sanitizedContent,
              authorId: "wikipedia",
              authorName: "Wikipedia",
              authorPicture: "https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png",
            };
        }));
    } catch (err) {
        console.error("Error searching Wikipedia:", err);
        return [];
    }
}