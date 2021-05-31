import { BrowserType } from "../../src/browser";
import { generateBrowserTest } from "./browser.generator";
import { generateElementTest } from "./element.generator";
import { generateWebDriverTest } from "./webdriver.generator"
import { generateWindowTest } from "./window.generator";

describe('Browser : Safari', function (){
    generateWebDriverTest("Safari");
    generateBrowserTest("Safari")
    generateElementTest("Safari");
    generateWindowTest("Safari");
});