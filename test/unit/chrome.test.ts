import { BrowserType } from "../../src/browser";
import { generateBrowserTest } from "./browser.generator";
import { generateElementTest } from "./element.generator";
import { generateWebDriverTest } from "./webdriver.generator"

describe('Browser : Firefox', function (){
    generateWebDriverTest("Chrome");
    generateBrowserTest("Chrome");
    generateElementTest("Chrome");
});