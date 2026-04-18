<p align="center">

[![Coverage Status](https://coveralls.io/repos/github/simonradier/simple-webdriver/badge.svg?branch=refs/heads/main)](https://coveralls.io/github/simonradier/simple-webdriver?branch=refs/heads/main)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=simonradier_simple-webdriver&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=simonradier_simple-webdriver)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=simonradier_simple-webdriver&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=simonradier_simple-webdriver)

</p>

# simple-webdriver

A webdriver javascript bindings written in typescript with no dependency

# How to get started

Install the package `simple-webdriver`
`npm install --save simple-webdriver`
Install a W3C compatible webdriver

```
npm install --save webdriver-manager
webdriver-manager update
webdriver-manager start
```

Start to code :

```ts
import { WebDriver, BrowserType } from "simple-webdriver"

async function example() {
    const session = WebDriver.w3c("http://localhost:4440/wd/hub")
    const browser = await session.start(BrowserType.Chrome)
    await browser.navigate().to("http://perdu.com")
    console.log(await browser.getTitle())
    await browser.close()
}

example()
```

## CDP mode (no external driver required)

`WebDriver.cdp()` launches Chrome/Chromium/Edge directly and talks to
the browser's DevTools Protocol over WebSocket — no chromedriver,
geckodriver or msedgedriver needed. Supported on Chromium-family
browsers only; Firefox / Safari keep requiring the W3C driver.

```ts
import { WebDriver, BrowserType } from "simple-webdriver"

const session = WebDriver.cdp({
    browser: "chrome",          // 'chrome' | 'chromium' | 'msedge'
    headless: true,             // optional
    executablePath: "/path/..." // optional; auto-detected on mac/linux/win
})
const browser = await session.start(BrowserType.Chrome)
await browser.navigate().to("https://example.com")
console.log(await browser.getTitle())
await browser.close()
```

Integration tests against a real Chromium binary:

```sh
CDP_BROWSER=chrome npm run test-cdp-chrome
CDP_BROWSER=msedge npm run test-cdp-edge
CDP_EXECUTABLE_PATH=/opt/chrome/chrome npm run test-cdp-chrome
CDP_HEADLESS=0 npm run test-cdp-chrome   # watch what happens
```

## Protocol selection

| Factory                           | Protocol   | Notes                                   |
|-----------------------------------|------------|-----------------------------------------|
| `WebDriver.w3c(url)`              | W3C / HTTP | Talks to an external driver binary.     |
| `WebDriver.cdp(options)`          | CDP / WS   | Launches Chromium-family browsers itself. |
| `new WebDriver(url, protocol)`    | *deprecated* | Kept for backward compat; prefer the factories. |

# Warning

This is an early version which should not be used in production environment. Major changes can occur before 1.0.0.
