import { expect } from 'chai'
import nock from 'nock'
import { Cookie } from '../../src'
import { Browser, BrowserType } from '../../src/browser'
import { loggerConfiguration, LogLevel } from '../../src/utils/logger'
import { Using, WebDriver } from '../../src/webdriver'
import { WindowType } from '../../src/window'
import * as td from './data'

export function generateBrowserTest(browserType: string) {
  describe('Browser', function () {
    let g_driver: WebDriver
    let g_browser: Browser
    before(async function () {
      // Deactivate WebDriver Logs
      loggerConfiguration.logLevel = LogLevel.Debug
      // Clean previous sessions
      await WebDriver.cleanSessions()
      g_driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType])
    })

    afterEach(async function () {
      if (!nock.isActive()) {
        if (browserType === 'Safari' || browserType === 'Firefox')
          // wait 1.5 sec for Safari or Firefox to avoid "Could not create a session error"
          await new Promise(resolve => setTimeout(resolve, 1500))
        await WebDriver.cleanSessions()
      }
    })

    beforeEach(async function () {
      nock.cleanAll()
      // Required for session Start
      const resp = td.WD_START_SESSION_RESPONSE.OK
      nock(td.WD_SERVER_URL_HTTP[browserType])
        .post('/session')
        .reply(resp.code, resp.body, resp.headers)
      g_browser = await g_driver.start(BrowserType[browserType])
    })

    describe('close', function () {
      it('should close the browser and the associated windows if the webdriver response is successful', async function () {
        const resp = td.WD_STOP_SESSION_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .delete(`/session/${td.WD_SESSION_ID}`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.close()).to.be.fulfilled
        expect(g_browser.closed).to.be.true
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_STOP_SESSION_RESPONSE.KO_ERROR
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .delete(`/session/${td.WD_SESSION_ID}`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.close()).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.close()).to.be.rejectedWith(/closed/)
      })
    })

    describe('getCurrentWindow', function () {
      it("should return the window's handle if the webdriver response is successful", async function () {
        const resp = td.WD_WINDOW_HANDLE_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/window`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getCurrentWindow()).to.be.fulfilled
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_WINDOW_HANDLE_RESPONSE.KO
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/window`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getCurrentWindow()).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.getCurrentWindow()).to.be.rejectedWith(/closed/)
      })
    })

    describe('getTitle', async function () {
      beforeEach(async function () {
        // Required for .navigate
        const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/url`)
          .reply(resp3.code, resp3.body, resp3.headers)
        await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
      })

      it('should return the title of the windows if the webdriver server response is successful', async function () {
        const resp = td.WD_WINDOW_GETTITLE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/title`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getTitle()).to.become('WD2 Test Page')
      })
      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_WINDOW_GETTITLE.KO
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/title`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getTitle()).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.getTitle()).to.be.rejectedWith(/closed/)
      })
    })

    describe('getAllWindows', function () {
      it("should return the window's handle if the webdriver response is successful", async function () {
        const resp = td.WD_WINDOW_HANDLES_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/window/handles`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getAllWindows()).to.be.fulfilled
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_WINDOW_HANDLES_RESPONSE.KO
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/window/handles`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.getAllWindows()).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.getAllWindows()).to.be.rejectedWith(/closed/)
      })
    })

    describe('newWindow', function () {
      it('should open a new window  if the webdriver response is successful (new Window)', async function () {
        const resp = td.WD_WINDOW_OPEN.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/window/new`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.newWindow(WindowType.Window)).to.be.fulfilled
      })

      it('should open a new window  if the webdriver response is successful (new Window)', async function () {
        const resp = td.WD_WINDOW_OPEN.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/window/new`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.newWindow(WindowType.Tab)).to.be.fulfilled
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_WINDOW_OPEN.KO
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/window/new`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.newWindow(WindowType.Tab)).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.newWindow(WindowType.Tab)).to.be.rejectedWith(/closed/)
      })
    })

    describe('findElement', function () {
      beforeEach(async function () {
        // Required for .navigate.to()
        const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/url`)
          .reply(resp3.code, resp3.body, resp3.headers)
        await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
      })

      for (const using in Using) {
        if (using === 'className' || using === 'id' || using === 'name') {
          it(
            'should return a Element using the execute_sync API with ' +
              using +
              ' search',
            async function () {
              const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT
              nock(td.WD_SERVER_URL_HTTP[browserType])
                .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
                .reply(resp.code, resp.body, resp.headers)
              //@ts-ignore
              await expect(
                g_browser.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])
              ).to.be.fulfilled
            }
          )
        } else {
          it(
            'should return a Element using the element API with ' + using + ' search',
            async function () {
              const resp = td.WD_FIND_ELEMENT_RESPONSE.OK
              nock(td.WD_SERVER_URL_HTTP[browserType])
                .post(`/session/${td.WD_SESSION_ID}/element`)
                .reply(resp.code, resp.body, resp.headers)
              //@ts-ignore
              await expect(
                g_browser.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])
              ).to.be.fulfilled
            }
          )
        }
      }

      it('should throw an error if the API return an error | Nock Only', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_ERROR
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(g_browser.findElement(Using.css, 'test')).to.be.rejectedWith(
          /element : this is an unknown error/
        )
      })

      it("should throw a LocationError if element can't be found", async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.findElement(Using.css, 'test')).to.be.rejectedWith(
          /Cannot locate : test/
        )
      })

      it('should find an element before the timeout  | Nock Only', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .times(50)
          .reply(resp.code, resp.body, resp.headers)
        const resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .reply(resp2.code, resp2.body, resp2.headers)
        await expect(g_browser.findElement(Using.css, '.class_1234', 3000)).to.be
          .fulfilled
      })

      it('should thrown an error if element is not found before the timeout', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .times(100)
          .reply(resp.code, resp.body, resp.headers)
        const resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/element`)
          .reply(resp2.code, resp2.body, resp2.headers)
        await expect(
          g_browser.findElement(Using.css, '.class_dont_exist', 50)
        ).to.be.rejectedWith(/Cannot locate :/)
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.findElement(Using.css, '.class_1234', 3000)).to.be.rejected
      })
    })

    describe('findElements', function () {
      beforeEach(async function () {
        // Required for .navigate.to()
        const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/url`)
          .reply(resp3.code, resp3.body, resp3.headers)
        await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
      })

      for (const using in Using) {
        if (using === 'className' || using === 'id' || using === 'name') {
          it(
            'should return a Element using the execute_sync API with ' +
              using +
              ' search',
            async function () {
              const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT
              nock(td.WD_SERVER_URL_HTTP[browserType])
                .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
                .reply(resp.code, resp.body, resp.headers)
              //@ts-ignore
              await expect(
                g_browser.findElements(Using[using], td.WD_ELEMENT_SEARCH[using])
              ).to.be.fulfilled
            }
          )
        } else {
          it(
            'should return a Element using the element API with ' + using + ' search',
            async function () {
              const resp = td.WD_FIND_ELEMENT_RESPONSE.OK
              nock(td.WD_SERVER_URL_HTTP[browserType])
                .post(`/session/${td.WD_SESSION_ID}/elements`)
                .reply(resp.code, resp.body, resp.headers)
              //@ts-ignore
              await expect(
                g_browser.findElements(Using[using], td.WD_ELEMENT_SEARCH[using])
              ).to.be.fulfilled
            }
          )
        }
      }

      it('should throw an error if the API return an error | Nock Only', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_ERROR
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(g_browser.findElements(Using.css, 'test')).to.be.rejectedWith(
          /element : this is an unknown error/
        )
      })

      it("should throw a LocationError if element can't be found", async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.findElements(Using.css, 'test')).to.be.rejectedWith(
          /Cannot locate : test/
        )
      })

      it('should find an element before the timeout  | Nock Only', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .times(50)
          .reply(resp.code, resp.body, resp.headers)
        const resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .reply(resp2.code, resp2.body, resp2.headers)
        await expect(g_browser.findElements(Using.css, '.class_1234', 3000)).to.be
          .fulfilled
      })

      it('should thrown an error if element is not found before the timeout', async function () {
        const resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .times(100)
          .reply(resp.code, resp.body, resp.headers)
        const resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/elements`)
          .reply(resp2.code, resp2.body, resp2.headers)
        await expect(
          g_browser.findElements(Using.css, '.class_dont_exist', 50)
        ).to.be.rejectedWith(/Cannot locate :/)
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.findElements(Using.css, '.class_1234', 3000)).to.be
          .rejected
      })
    })

    describe('executeSync', function () {
      it('should execute the function and return the correct value if webdriver response is successful (1)', async function () {
        const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_STRING
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeSync(() => {
            return 'hello'
          })
        ).to.be.fulfilled
        const val = await g_browser.executeSync(() => {
          return 'hello'
        })
        expect(val).to.be.equal('hello')
      })

      it('should execute the function and return the correct value if webdriver response is successful (2)', async function () {
        const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_NUMBER
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeSync(() => {
            return 10
          })
        ).to.be.fulfilled
        const val = await g_browser.executeSync(() => {
          return 10
        })
        expect(val).to.be.equal(10)
      })

      it('should execute the function and return the correct value if webdriver response is successful (3)', async function () {
        const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ARRAY
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeSync(() => {
            return [1, 2, 3]
          })
        ).to.be.fulfilled
        const val = await g_browser.executeSync(() => {
          return [1, 2, 3]
        })
        expect(val.length).to.be.equal(3)
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_EXECUTE_SYNC_RESPONSE.KO_ERROR
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/execute/sync`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.executeSync('return 0')).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.executeSync('return 0')).to.be.rejectedWith(/closed/)
      })
    })

    describe('executeAsync', function () {
      it('should execute the function and return the correct value if webdriver response is successful (1)', async function () {
        const resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_STRING
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/async`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeAsync(done => {
            done('hello')
          })
        ).to.be.fulfilled
        const val = await g_browser.executeAsync(done => {
          done('hello')
        })
        expect(val).to.be.equal('hello')
      })

      it('should execute the function and return the correct value if webdriver response is successful (2)', async function () {
        const resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_NUMBER
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/async`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeAsync(done => {
            done(10)
          })
        ).to.be.fulfilled
        const val = await g_browser.executeAsync(done => {
          done(10)
        })
        expect(val).to.be.equal(10)
      })

      it('should execute the function and return the correct value if webdriver response is successful (3)', async function () {
        const resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_ARRAY
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/execute/async`)
          .twice()
          .reply(resp.code, resp.body, resp.headers)
        //@ts-ignore
        await expect(
          g_browser.executeAsync(done => {
            done([1, 2, 3])
          })
        ).to.be.fulfilled
        const val = await g_browser.executeAsync(done => {
          done([1, 2, 3])
        })
        expect(val.length).to.be.equal(3)
      })

      it('should throw an error if the webdriver server return an error | Nock Only', async function () {
        const resp = td.WD_EXECUTE_ASYNC_RESPONSE.KO_ERROR
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .get(`/session/${td.WD_SESSION_ID}/execute/async`)
          .reply(resp.code, resp.body, resp.headers)
        await expect(g_browser.executeAsync('return 0')).to.be.rejected
      })

      it('should throw an error if browser is closed', async function () {
        //@ts-ignore required for test purpose
        g_browser._closed = true
        await expect(g_browser.executeAsync('return 0')).to.be.rejectedWith(/closed/)
      })
    })

    describe('navigate', function () {
      describe('to', function () {
        it('should navigate to the website page with no error if result is OK', async function () {
          const resp = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled
        })

        it('should navigate to the website page with no error several times', async function () {
          const resp = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .thrice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP), 'first try').to.be
            .fulfilled
          await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP), 'second try').to
            .be.fulfilled
          await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP), 'third try').to.be
            .fulfilled
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_NAVIGATE_TO_RESPONSE.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(
            g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
          ).to.be.rejectedWith(/navigate/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
          }).to.throw(/closed/)
        })
      })

      describe('getCurrentURL', function () {
        beforeEach(async function () {
          // Required for .navigate
          const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp3.code, resp3.body, resp3.headers)
          await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
        })

        it('should retreive the website URL with no error if result is OK', async function () {
          const resp = td.WD_NAVIGATE_CURRENTURL.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().getCurrentURL()).to.become(
            td.WD_WEBSITE_URL_HTTP
          )
        })

        it('should navigate to the website page with no error several times', async function () {
          const resp = td.WD_NAVIGATE_CURRENTURL.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/url`)
            .thrice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().getCurrentURL(), 'first try').to.become(
            td.WD_WEBSITE_URL_HTTP
          )
          await expect(g_browser.navigate().getCurrentURL(), 'second try').to.become(
            td.WD_WEBSITE_URL_HTTP
          )
          await expect(g_browser.navigate().getCurrentURL(), 'third try').to.become(
            td.WD_WEBSITE_URL_HTTP
          )
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_NAVIGATE_CURRENTURL.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/url`)
            .twice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().getCurrentURL()).to.be.rejectedWith(/geturl/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().getCurrentURL()
          }).to.throw(/closed/)
        })
      })

      describe('refresh', function () {
        beforeEach(async function () {
          // Required for .navigate.to()
          const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp3.code, resp3.body, resp3.headers)
          await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
        })
        it('should refresh to the website page with no error if result is OK', async function () {
          const resp3 = td.WD_NAVIGATE_REFRESH_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/refresh`)
            .reply(resp3.code, resp3.body, resp3.headers)
          await expect(g_browser.navigate().refresh()).to.be.fulfilled
        })

        it('should refresh to the website page with no error several times', async function () {
          const resp = td.WD_NAVIGATE_REFRESH_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/refresh`)
            .thrice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().refresh()).to.be.fulfilled
          await expect(g_browser.navigate().refresh()).to.be.fulfilled
          await expect(g_browser.navigate().refresh()).to.be.fulfilled
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_NAVIGATE_REFRESH_RESPONSE.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/refresh`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().refresh()).to.be.rejectedWith(/refresh/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().refresh()
          }).to.throw(/closed/)
        })
      })

      describe('back', function () {
        beforeEach(async function () {
          // Required for .navigate.to()
          const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp3.code, resp3.body, resp3.headers)
          await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
        })
        it('should refresh go to the previews web page with no error if result is OK', async function () {
          const resp = td.WD_NAVIGATE_BACK_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/back`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().back()).to.be.fulfilled
        })

        it('should refresh to go back several times', async function () {
          const resp = td.WD_NAVIGATE_BACK_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/back`)
            .thrice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().back()).to.be.fulfilled
          await expect(g_browser.navigate().back()).to.be.fulfilled
          await expect(g_browser.navigate().back()).to.be.fulfilled
        })

        it('should throw an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_NAVIGATE_BACK_RESPONSE.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/back`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().back()).to.be.rejectedWith(/back/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().back()
          }).to.throw(/closed/)
        })
      })

      describe('forward', function () {
        beforeEach(async function () {
          // Required for .navigate.to()
          const resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/url`)
            .reply(resp3.code, resp3.body, resp3.headers)
          await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
        })
        it('should refresh go to the previews web page with no error if result is OK', async function () {
          const resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/forward`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().forward()).to.be.fulfilled
        })

        it('should refresh to go back several times', async function () {
          const resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/forward`)
            .thrice()
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().forward()).to.be.fulfilled
          await expect(g_browser.navigate().forward()).to.be.fulfilled
          await expect(g_browser.navigate().forward()).to.be.fulfilled
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_NAVIGATE_FORWARD_RESPONSE.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/forward`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.navigate().forward()).to.be.rejectedWith(/forward/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().forward()
          }).to.throw(/closed/)
        })
      })
    })

    describe('frame', function () {
      beforeEach(async function () {
        const resp = td.WD_NAVIGATE_TO_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/url`)
          .reply(resp.code, resp.body, resp.headers)
        await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
      })

      describe('switch', function () {
        it('should be possible to switch to a frame with its number 1/2', async function () {
          const resp = td.WD_FRAME_SWITCH.OK_1
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO.number1)).to.be.fulfilled
        })

        it('should be possible to switch to a frame with its number 2/2', async function () {
          const resp = td.WD_FRAME_SWITCH.OK_2
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO.number2)).to.be.fulfilled
        })

        it('should not be possible to switch to a frame with an unknown number', async function () {
          const resp = td.WD_FRAME_SWITCH.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(
            g_browser.frame().switch(td.WD_FRAME_INFO.number3)
          ).to.be.rejectedWith(/no such frame/)
        })

        it('should be possible to switch to a frame with its id 1/2', async function () {
          const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
            .reply(resp.code, resp.body, resp.headers)
          //@ts-ignore
          const element = await g_browser.findElement(Using['id'], td.WD_FRAME_INFO.id1)
          const resp2 = td.WD_FRAME_SWITCH.OK_FRAME_ID
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp2.code, resp2.body, resp2.headers)
          await expect(g_browser.frame().switch(element.toString())).to.be.fulfilled
        })

        it('should be possible to switch to a frame with its id 2/2', async function () {
          const resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/execute/sync`)
            .reply(resp.code, resp.body, resp.headers)
          //@ts-ignore
          const element = await g_browser.findElement(Using['id'], td.WD_FRAME_INFO.id2)
          const resp2 = td.WD_FRAME_SWITCH.OK_FRAME_ID
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp2.code, resp2.body, resp2.headers)
          await expect(g_browser.frame().switch(element.toString())).to.be.fulfilled
        })

        it('should not be possible to switch to a frame with an unknown ids', async function () {
          const resp = td.WD_FRAME_SWITCH.KO_ELEM
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO.id3)).to.be.rejected
        })

        it('should be possible to switch to the top-context with the null value', async function () {
          const resp = td.WD_FRAME_SWITCH.OK_1
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO['top-context'])).to.be
            .fulfilled
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_FRAME_SWITCH.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO.id1)).to.be.rejectedWith(
            /no such frame/
          )
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.navigate().forward()
          }).to.throw(/closed/)
        })
      })
      describe('parent', function () {
        it('should be possible to switch to a parent frame with', async function () {
          const resp = td.WD_FRAME_SWITCH.OK_1
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().switch(td.WD_FRAME_INFO.number1)).to.be.fulfilled
          const resp2 = td.WD_FRAME_PARENT.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame/parent`)
            .reply(resp2.code, resp2.body, resp2.headers)
          await expect(g_browser.frame().parent()).to.be.fulfilled
        })

        it('should thrown an error if the webdriver server return an error | Nock Only', async function () {
          const resp = td.WD_FRAME_PARENT.KO
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/frame/parent`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.frame().parent()).to.be.rejectedWith(/no such window/)
        })

        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.frame().parent()
          }).to.throw(/closed/)
        })
      })
    })

    describe('cookies', function () {
      beforeEach(async function () {
        // Required for .navigate.to()
        const resp = td.WD_NAVIGATE_TO_RESPONSE.OK
        nock(td.WD_SERVER_URL_HTTP[browserType])
          .post(`/session/${td.WD_SESSION_ID}/url`)
          .reply(resp.code, resp.body, resp.headers)
        await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)
      })

      describe('get', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.cookie().get('cookie1')
          }).to.throw(/closed/)
        })

        it('should be possible to retreive an existing cookie 1/2', async function () {
          const resp = td.WD_COOKIE_GET.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie1`)
            .reply(resp.code, resp.body, resp.headers)
          const result = await g_browser.cookie().get('cookie1')
          expect(result.name).to.be.equal(resp.body.value.name)
          expect(result.value).to.be.equal(resp.body.value.value)
        })

        it('should be possible to retreive an existing cookie 2/2', async function () {
          const resp = td.WD_COOKIE_GET.OK_2
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie2`)
            .reply(resp.code, resp.body, resp.headers)
          const result = await g_browser.cookie().get('cookie2')
          expect(result.name).to.be.equal(resp.body.value.name)
          expect(result.value).to.be.equal(resp.body.value.value)
        })

        it('should throw an error if the cookie does not exist', async function () {
          const resp = td.WD_COOKIE_GET.KO_ERROR
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie3`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.cookie().get('cookie3')).to.be.rejectedWith(
            /no such cookie/
          )
        })
      })

      describe('getAll', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.cookie().get('cookie1')
          }).to.throw(/closed/)
        })

        it('should be possible to retreive existing cookies', async function () {
          const resp = td.WD_COOKIE_GETALL.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie`)
            .reply(resp.code, resp.body, resp.headers)
          const result = await g_browser.cookie().getAll()
          expect(result.length).to.be.equal(td.WD_COOKIE_GETALL.OK.body.value.length)
          expect(result[0].name).to.be.oneOf([
            td.WD_COOKIE_GETALL.OK.body.value[0].name,
            td.WD_COOKIE_GETALL.OK.body.value[1].name
          ])
          expect(result[0].value).to.be.oneOf([
            td.WD_COOKIE_GETALL.OK.body.value[0].value,
            td.WD_COOKIE_GETALL.OK.body.value[1].value
          ])
          expect(result[1].name).to.be.oneOf([
            td.WD_COOKIE_GETALL.OK.body.value[0].name,
            td.WD_COOKIE_GETALL.OK.body.value[1].name
          ])
          expect(result[1].value).to.be.oneOf([
            td.WD_COOKIE_GETALL.OK.body.value[0].value,
            td.WD_COOKIE_GETALL.OK.body.value[1].value
          ])
        })
      })

      describe('create', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          let cookie = new Cookie(g_browser, { name: 'test', value: 'test' })
          expect(() => {
            g_browser.cookie().create(cookie)
          }).to.throw(/closed/)
        })

        it('should be possible to create a cookie and retreive it', async function () {
          const resp = td.WD_COOKIE_CREATE.OK
          const resp2 = td.WD_COOKIE_GET.OK_3
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/cookie`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(
            g_browser.cookie().create(
              new Cookie(g_browser, {
                name: resp2.body.value.name,
                value: resp2.body.value.value
              })
            )
          ).to.be.fulfilled
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie3`)
            .reply(resp2.code, resp2.body, resp2.headers)
          const result = await g_browser.cookie().get('cookie3')
          expect(result.name).to.be.equal(resp2.body.value.name)
          expect(result.value).to.be.equal(resp2.body.value.value)
        })
      })

      describe('update', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          let cookie = new Cookie(g_browser, { name: 'test', value: 'test' })
          expect(() => {
            g_browser.cookie().update(cookie)
          }).to.throw(/closed/)
        })

        it('should be possible to update an existing cookie and retreive its new value', async function () {
          const resp = td.WD_COOKIE_CREATE.OK
          const resp2 = td.WD_COOKIE_GET.OK_UPDATE
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .post(`/session/${td.WD_SESSION_ID}/cookie`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(
            g_browser.cookie().update(
              new Cookie(g_browser, {
                name: resp2.body.value.name,
                value: resp2.body.value.value
              })
            )
          ).to.be.fulfilled
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie1`)
            .reply(resp2.code, resp2.body, resp2.headers)
          const result = await g_browser.cookie().get('cookie1')
          expect(result.name).to.be.equal(resp2.body.value.name)
          expect(result.value).to.be.equal(resp2.body.value.value)
        })
      })
      describe('delete', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.cookie().delete('cookie1')
          }).to.throw(/closed/)
        })

        it('should be possible to delete a cookie', async function () {
          const resp = td.WD_COOKIE_DELETE.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .delete(`/session/${td.WD_SESSION_ID}/cookie/cookie1`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.cookie().delete('cookie1')).to.be.fulfilled
          const resp2 = td.WD_COOKIE_GET.KO_ERROR
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie1`)
            .reply(resp2.code, resp2.body, resp2.headers)
          await expect(g_browser.cookie().get('cookie1')).to.be.rejectedWith(
            'no such cookie'
          )
        })
      })
      describe('deleteAll', function () {
        it('should throw an error if browser is closed', async function () {
          //@ts-ignore required for test purpose
          g_browser._closed = true
          expect(() => {
            g_browser.cookie().deleteAll()
          }).to.throw(/closed/)
        })

        it('should be possible to delete all cookies', async function () {
          const resp = td.WD_COOKIE_DELETE_ALL.OK
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .delete(`/session/${td.WD_SESSION_ID}/cookie`)
            .reply(resp.code, resp.body, resp.headers)
          await expect(g_browser.cookie().deleteAll()).to.be.fulfilled
          const resp2 = td.WD_COOKIE_GET.KO_ERROR
          nock(td.WD_SERVER_URL_HTTP[browserType])
            .get(`/session/${td.WD_SESSION_ID}/cookie/cookie1`)
            .reply(resp2.code, resp2.body, resp2.headers)
          await expect(g_browser.cookie().get('cookie1')).to.be.rejectedWith(
            'no such cookie'
          )
        })
      })
    })
  })
}
