import { BrowserType } from '../../src/browser'
import { generateBrowserTest } from './browser.generator'
import { generateElementTest } from './element.generator'
import { generateWebDriverTest } from './webdriver.generator'
import { generateWindowTest } from './window.generator'

describe('Browser : Chrome', function () {
  generateWebDriverTest('Chrome')
  generateBrowserTest('Chrome')
  generateElementTest('Chrome')
  generateWindowTest('Chrome')
})
