# simple-webdriver
A webdriver javascript bindings written in typescript with no dependency

# How to get started
Install the package ```simple-webdriver```
```npm install --save simple-webdriver```
Install a W3C compatible webdriver
```
npm install --save webdriver-manager
webdriver-manager update
webdriver-manager start
```

Start to code :

```
import { WebDriver } from "simple-webdriver"


async function example() {
    let session =  new WebDriver("http://localhost:4440/wd/hub");
    let browser = await session.start();
    await browser.navigate().to("http://perdu.com");
    let title = await browser.getTitle();
    console.log(title);
} 

example();

```

# Warning
This is an early version which should not be used in production environment. Major changes can occur before 1.0.0.
