import { generateBrowserTest } from './browser.generator.js'
import { generateElementTest } from './element.generator.js'
import { generateWebDriverTest } from './webdriver.generator.js'
import { generateWindowTest } from './window.generator.js'

describe('Browser : Firefox', function () {
  generateWebDriverTest('Firefox')
  generateBrowserTest('Firefox')
  generateElementTest('Firefox')
  generateWindowTest('Firefox')
})
