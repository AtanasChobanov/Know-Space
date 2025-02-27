app.post("/search-post", async (req, res) => {
    const searchedItem = req.body.searchedItem;
    const posts = await getPostsByTitle(searchedItem);

    let wikiData = null;
    if (posts.length === 0) {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchedItem)}`);
        if (response.ok) {
            const data = await response.json();
            wikiData = {
                extract: data.extract,
                url: data.content_urls.desktop.page,
            };
        }
    }
    res.render("channel", { channel, posts, wikiData });
});
