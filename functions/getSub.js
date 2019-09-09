"use strict";

const axios = require("axios");
const cheerio = require("cheerio");

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
  const rawSubData = await getRawSubData();
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: getName(rawSubData),
    description: getDescription(rawSubData),
    price: getPrice(rawSubData),
    priceCurrency: "USD",
    priceValidUntil: getPriceValidUntil(rawSubData)
  };
};

const getRawSubData = async () => {
  let pageNumber = 0;
  let $, subObject, subFound, nextPageExists;
  do {
    $ = await fetchPage(++pageNumber);
    subObject = Array.from($(".newListings").find(".gridTileUnitB")).find(
      deal => {
        return $(".desktopBBDTabletTitle span", deal)
          .text()
          .includes("Whole Sub");
      }
    );
    subFound = subObject !== undefined;
    nextPageExists =
      $("body").find("a.action-next.jscroll-next-tag").length > 0;
  } while (!subFound && nextPageExists);
  return subObject;
};

const fetchPage = async PAGE_NUMBER => {
  const STORE_ID = "2622294";
  const CATEGORY_ID = "5232526";
  const API_URL = `https://weeklyad.publix.com/Publix/BrowseByListing/ByCategory/?IsPartial=Y&SneakPeek=N&StoreID=${STORE_ID}&CategoryID=${CATEGORY_ID}&PageNumber=${PAGE_NUMBER}`;
  const result = await axios.get(API_URL);
  return cheerio.load(result.data, { normalizeWhitespace: true });
};

const getName = rawSubData => {
  const $ = cheerio.load(rawSubData);
  return $(".desktopBBDTabletTitle span").text();
};

const getDescription = rawSubData => {
  const $ = cheerio.load(rawSubData);
  return $(".itemDescriptionText span").text();
};

const getPrice = rawSubData => {
  const $ = cheerio.load(rawSubData);
  return $(".deal span")
    .text()
    .split(" ")[0];
};

const getPriceValidUntil = rawSubData => {
  const $ = cheerio.load(rawSubData);
  const dateRangeStringArray = $(".sc_mobileDate p")
    .text()
    .trim()
    .replace("\n", " ")
    .split(" ")
    .filter(str => !isNaN(str[0]));
  const dateRange = {
    startDate: dateRangeStringArray[0],
    endDate: dateRangeStringArray[1]
  };
  let yearNumber = new Date().getFullYear();
  if (
    parseInt(dateRange.startDate.split("/")[0]) === 12 &&
    parseInt(dateRange.endDate.split("/")[0]) === 1
  ) {
    yearNumber++;
  }
  const expiryDate = new Date(`${dateRange.endDate}/${yearNumber}`)
    .toISOString()
    .split("T")[0];
  return expiryDate;
};
