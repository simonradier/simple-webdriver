import { generateBrowserTest } from './browser.generator'
import { generateElementTest } from './element.generator'
import { generateWebDriverTest } from './webdriver.generator'
import { generateWindowTest } from './window.generator'

describe('Browser : Firefox', function () {
  generateWebDriverTest('Firefox')
  generateBrowserTest('Firefox')
  generateElementTest('Firefox')
  generateWindowTest('Firefox')
})
