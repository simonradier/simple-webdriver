import { BrowserType } from '../../src/browser.js'
import { generateBrowserTest } from './browser.generator.js'
import { generateElementTest } from './element.generator.js'
import { generateWebDriverTest } from './webdriver.generator.js'
import { generateWindowTest } from './window.generator.js'

describe('Browser : Safari', function () {
  generateWebDriverTest('Safari')
  generateBrowserTest('Safari')
  generateElementTest('Safari')
  generateWindowTest('Safari')
})
