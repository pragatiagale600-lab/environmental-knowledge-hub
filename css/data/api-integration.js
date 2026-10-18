
/* Environmental Knowledge Hub - API Integration
   Uses Wikimedia Commons API without an API key.
*/

const EnvironmentalAPI = (() => {
  const topics = [
    {
      id: "disaster",
      search: "natural disaster flood",
      title: "Disaster"
    },
    {
      id: "pollution",
      search: "environmental pollution plastic waste",
      title: "Pollution"
    },
    {
      id: "climate-change",
      search: "climate change drought",
      title: "Climate Change"
    },
    {
      id: "deforestation",
      search: "deforestation forest clearing",
      title: "Deforestation"
    },
    {
      id: "conservation",
      search: "nature conservation forest",
      title: "Conservation"
    }
  ];

  async function searchImage(query) {
    const url = new URL(
      "https://commons.wikimedia.org/w/api.php"
    );

    url.search = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query + " filetype:bitmap",
      gsrnamespace: "6",
      gsrlimit: "5",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "700",
      format: "json",
      origin: "*"
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Image API request failed");
    }

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});

    const image = pages.find(page =>
      page.imageinfo?.[0]?.thumburl
    );

    if (!image) return null;

    const info = image.imageinfo[0];

    return {
      url: info.thumburl,
      pageUrl: info.descriptionurl,
      title: image.title.replace("File:", ""),
      license:
        info.extmetadata?.LicenseShortName?.value || "See source",
      artist:
        info.extmetadata?.Artist?.value || "See source"
    };
  }

  async function loadTopicImages() {
    const results = await Promise.allSettled(
      topics.map(async topic => ({
        ...topic,
        image: await searchImage(topic.search)
      }))
    );

    results.forEach(result => {
      if (result.status !== "fulfilled") return;

      const topic = result.value;
      if (!topic.image) return;

      const card = document.querySelector(
        `.topic-card[data-cat="${topic.id}"]`
      );

      if (!card) return;

      let imageBox = card.querySelector(".api-topic-image");

      if (!imageBox) {
        imageBox = document.createElement("div");
        imageBox.className = "api-topic-image";

        const header = card.querySelector(".topic-card-header");

        if (header) {
          card.insertBefore(imageBox, header);
        } else {
          card.prepend(imageBox);
        }
      }

      imageBox.replaceChildren();

      const img = document.createElement("img");
      img.src = topic.image.url;
      img.alt = topic.title;
      img.loading = "lazy";

      Object.assign(img.style, {
        width: "100%",
        height: "150px",
        objectFit: "cover",
        display: "block",
        borderRadius: "8px"
      });

      img.onerror = () => imageBox.remove();
      imageBox.appendChild(img);

      const credit = document.createElement("a");
      credit.href = topic.image.pageUrl;
      credit.target = "_blank";
      credit.rel = "noopener noreferrer";
      credit.textContent =
        `Photo source: Wikimedia Commons | ${topic.image.license}`;

      Object.assign(credit.style, {
        display: "block",
        fontSize: "10px",
        marginTop: "5px",
        overflowWrap: "anywhere"
      });

      imageBox.appendChild(credit);
    });
  }

  return { loadTopicImages, searchImage };
})();

window.EnvironmentalAPI = EnvironmentalAPI;

document.addEventListener("DOMContentLoaded", () => {
  EnvironmentalAPI.loadTopicImages().catch(error => {
    console.warn("Environmental photo API unavailable:", error);
  });
});

/* Load relevant photos for Featured Case Studies */

window.EnvironmentalAPI.loadCaseStudyImages = async function () {
  const cards = document.querySelectorAll(
    "#recentStudiesGrid .case-card"
  );

  const categorySearch = {
    disaster: "natural disaster flood",
    pollution: "environmental pollution plastic waste",
    "climate-change": "climate change drought",
    deforestation: "deforestation forest",
    conservation: "wildlife conservation"
  };

  async function findPhoto(searchText) {
    const url = new URL(
      "https://commons.wikimedia.org/w/api.php"
    );

    url.search = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: searchText,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "600",
      format: "json",
      origin: "*"
    });

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});

    const image = pages.find(page =>
      page.imageinfo?.[0]?.thumburl
    );

    return image?.imageinfo?.[0]?.thumburl || null;
  }

  for (const card of cards) {
    const img = card.querySelector(".case-card-img");
    if (!img) continue;

    const title = card.querySelector(
      ".case-card-title"
    )?.textContent.trim();

    // Read the category from the card's data, when available.
    const category = (
      card.dataset.category ||
      card.dataset.cat ||
      ""
    ).toLowerCase();

    const categoryQuery =
      categorySearch[category] || category;

    try {
      let photo = null;

      // First try a photo related to the case study title.
      if (title) {
        photo = await findPhoto(title);
      }

      // If no suitable result is returned, try the category.
      if (!photo && categoryQuery) {
        photo = await findPhoto(categoryQuery);
      }

      // Replace only when the API returns an image.
      if (photo) {
        img.onerror = () => {
          img.onerror = null;
          img.src =
            "https://placehold.co/600x350/e8eee7/405747?text=Environmental+Case+Study";
        };

        img.src = photo;
      }
    } catch (error) {
      console.warn("Case study photo unavailable:", error);
    }
  }
};
