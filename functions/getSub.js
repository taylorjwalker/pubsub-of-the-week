"use strict";

const axios = require("axios");

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
      (item.department && item.department === "Deli") &&
      (item.title && item.title.includes("Whole Sub"))
  )[0];

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: subOfTheWeek.title,
    description: subOfTheWeek.description,
    price: subOfTheWeek.finalPrice,
    priceCurrency: "USD",
    priceValidUntil: subOfTheWeek.wa_postEndDate.split("T")[0],
    image: getImagePath(subOfTheWeek.title)
  };
};

const getImagePath = subName => {
  if (subName.toLowercase().includes("chicken tender")) {
    return "./images/publix/chicken-tender.jpg";
  } else return "";
};
