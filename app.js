import express from "express";

import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import vanillaPuppeteer from "puppeteer";
import { EOL } from "os";

const puppeteer = addExtra(vanillaPuppeteer);
puppeteer.use(StealthPlugin());

var proxies = fs
  .readFileSync("proxies.txt")
  .toString()
  .split(EOL)
  .map((p) => {
    let parts = p.split(":");

    let host = parts[0];
    let port = parts[1];
    let login = parts[2];
    let password = parts[3];

    return {
      host,
      port,
      login,
      password,
    };
  });

puppeteer.use(StealthPlugin());

let app = express();
app.use(express.json());

app.listen(3001, () => {
  console.log("Server running on port 3001");
});

app.post("/api/v1/translations", async (req, res, next) => {
  var translation = await translateText(req.body.text, req.body.from, [
    req.body.to,
  ]);

  console.log("done");

  res.send(translation);
});

app.post("/api/v1/translate", async (req, res, next) => {
  var translation = await translateText(req.body.text, req.body.from, [
    req.body.to,
  ]);

  console.log("done");

  res.send(translation);
});

app.post("/api/v1/paraphrase", async (req, res, next) => {
  console.log(req);

  var translation = await translateText(req.body.text, req.body.from, [
    req.body.langs,
  ]);

  console.log("done");

  res.send(translation);
});

async function translateText(text, from, langs) {
  let proxyIndex = getRandomInt(0, proxies.length - 1);

  var proxy = {
    address: proxies[proxyIndex].host,
    port: proxies[proxyIndex].port,
    username: proxies[proxyIndex].login,
    password: proxies[proxyIndex].password,
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${proxy.address}:${proxy.port}`],
  });

  try {
    const languages = [from, ...langs];

    let currentText = text;

    const page = await browser.newPage();

    await page.authenticate({
      username: proxy.username,
      password: proxy.password,
    });

    for (let i = 0; i < languages.length - 1; i++) {
      var address = `https://translate.google.com/?sl=${languages[i]}&tl=${
        languages[i + 1]
      }`;

      await page.goto(address);

      //await page.focus('.er8xn');
      //await page.keyboard.type(currentText);

      await page.$eval(
        ".er8xn",
        (el, value) => (el.value = value),
        currentText
      );

      await page.focus(".er8xn");
      await page.keyboard.type("\n");

      var mainTranslationEl = await page.waitForSelector(".VIiyi", {
        timeout: 30000,
      });

      let value = await page.evaluate((el) => el.innerText, mainTranslationEl);

      currentText = value;
    }

    await browser.close();

    return currentText;
  } catch (ex) {
    await browser.close();
    throw new Error(ex.message);
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
