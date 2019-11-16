"use strict";

const axios = require("axios");
const decode = require("unescape");

exports.handler = async () => {
  try {
    const subData = await getSubData();
    const statusCode = 200;
    const headers = { "Content-Type": "application/ld+json" };
    return {
      statusCode,
      body: JSON.stringify(subData),
      headers
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};

const getSubData = async () => {
  const API_URL =
    "https://services.publix.com/api/v2/savings/search?keyword=$WHOLE%20SUB";
  const STORE_ID = 537;
  const OPTIONS = {
    headers: { PublixStore: STORE_ID }
  };

  const { data: searchResponse } = await axios.get(API_URL, OPTIONS);
  const subOfTheWeek = searchResponse.filter(
    item =>
      item.savingType &&
      item.savingType === "WeeklyAd" &&
      item.department &&
      item.department === "Deli" &&
      item.title &&
      item.title.includes("Whole Sub")
  )[0];

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: sanitize(subOfTheWeek.title),
    description: sanitize(subOfTheWeek.description),
    price: subOfTheWeek.finalPrice,
    priceCurrency: "USD",
    priceValidUntil: subOfTheWeek.wa_postEndDate.split("T")[0],
    image: getImagePath(subOfTheWeek.title)
  };
};

const getImagePath = subName => {
  subName = subName.toLowerCase();
  const brand = subName.includes("publix") ? "publix" : "boarshead";
  const fileName = subKeywords.forEach(keyword => {
    if (subName.includes(keyword)) {
      return keyword.replace("and", "").replace(" ", "-");
    }
  });
  return `https://pubsub.club/images/${brand}/${fileName}.jpg`;
};

const sanitize = str => {
  return decode(str, "all")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\w\d\s!"#$%&'(),\-./:;?]/g, "");
};

const subKeywords = [
  "chicken salad",
  "chicken tender",
  "cuban",
  "egg salad",
  "ham and turkey",
  "ham",
  "italian",
  "meatball",
  "mojo pork",
  "orange and blue",
  "philly cheese",
  "roast beef",
  "tuna salad",
  "turkey cranberry",
  "turkey",
  "ultimate",
  "veggie",
  "american",
  "blt",
  "cordon bleu",
  "deluxe",
  "everroast",
  "havana bold",
  "jerk turkey",
  "maple honey turkey"
];
