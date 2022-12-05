import { BrowserType } from '../../src/browser'
import { generateBrowserTest } from './browser.generator'
import { generateElementTest } from './element.generator'
import { generateWebDriverTest } from './webdriver.generator'
import { generateWindowTest } from './window.generator'

describe('Browser : Edge', function () {
  generateWebDriverTest('Edge')
  generateBrowserTest('Edge')
  generateElementTest('Edge')
  generateWindowTest('Edge')
})
