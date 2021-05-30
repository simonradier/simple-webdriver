import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { Browser, WebDriver, Using, Element, Capabilities, BrowserType } from "../../src/swd";
import { LoggerConfiguration, LogLevel } from "../../src/utils/logger";
import nock from "nock";
import * as td from './data';

chai.use(chaiAsPromised);

export function generateWebDriverTest(browserType : string) { 
    describe('WebDriver', function (){ 
        before(function () {
            // Deactivate WebDriver Logs
            LoggerConfiguration.logLevel = LogLevel.Trace;
        });


        afterEach(async function () {
            if (!nock.isActive()) {
                if (browserType === "Safari" || browserType === "Firefox") // wait 1 sec for Safari or Firefox to avoid "Could not create a session error"
                    await (new Promise(resolve => setTimeout(resolve, 1000)))
                await WebDriver.cleanSessions();
            }
        });
        describe('constructor', function (){
            it('should throw an error if the URL is not correct #1', function (){ 
                let driver : WebDriver;
                expect(function (){ driver = new WebDriver("totoFail")}).to.throw(/Invalid URL/);
            });
            it('should throw an error if the URL is not correct #2', function (){ 
                let driver : WebDriver;
                expect(function (){ driver = new WebDriver("ftp:///÷dfsfdqsd")}).to.throw(/Invalid Protocol/);
            });
            it('should create a new simple webdriver with http protocol', function (){ 
                let driver : WebDriver;
                driver = new WebDriver("http://localhost");
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with https protocol', function (){ 
                let driver : WebDriver;
                driver = new WebDriver("https://localhost");
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with specific port', function (){ 
                let driver : WebDriver;
                driver = new WebDriver("http://localhost:9515");
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with ' + browserType, function (){ 
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                expect(driver).to.be.not.null;
            });
        });

        describe('start', function (){
            beforeEach(function () {
                nock.cleanAll();
            });
            it('should throw an exception if the server is not listening', async function () { 
                let driver : WebDriver;
                driver = new WebDriver("http://127.0.0.1:50000");
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/ECONNREFUSED/);
            });
            it('should throw an exception if the server connection is timeouting', async function () { 
                let driver : WebDriver;
                driver = new WebDriver("http://fake-server.local");
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/ENOTFOUND|EAI_AGAIN/);
            }).timeout(10000);
            it('should throw an exception if the server is not a webdriver server 1/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_HTML;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/Incorrect HTTP header/);
            });

            it('should throw an exception if the server is not a webdriver server 2/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_EMPTY;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/empty or null/);
            });

            it('should throw an exception if the server is not a webdriver server 3/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NULL;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers)
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/empty or null/);
            });

            it('should throw an exception if the server is not a webdriver server 4/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_EMPTY;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers)
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/Missing.*sessionId/);
            });

            it('should throw an exception if the server is not a webdriver server 5/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NO_CAPA;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/Missing.*capabilities/);
            });

            /*it('should throw an exception if the server is not a webdriver server 6/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NO_TIMEOUTS;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], BrowserType[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Missing.*timeouts/);
            });*/

            it('should start a session if webdriver response is correct (http)', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                let browser = await driver.start(BrowserType[browserType], Capabilities.default)
                expect(browser).not.null
                if (nock.isActive()) {
                    expect(browser.session).to.be.equal(td.WD_SESSION_ID);
                    expect(browser.timeouts.implicit).to.not.be.null;
                    expect(browser.timeouts.pageLoad).to.not.be.null;
                    expect(browser.timeouts.script).to.not.be.null;
                    expect(nock.isDone(), 'all request were executed');
                }
            });

            it('should throw an error if the response is not a JSON object | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_NOJSON;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/Unexpected token/);
            });

            it('should throw an error if the server generate an error during response | Nock Only', async function () { 
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").replyWithError({
                    message: 'something awful happened',
                    code: 'AWFUL_ERROR'});
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/something awful happened/);
            });

            it('should start a session if webdriver response is correct (https) | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTPS[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTPS[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTPS[browserType]);
                let browser = await driver.start(BrowserType[browserType], Capabilities.default);
                expect(browser).not.null;
                if (nock.isActive()) {
                    expect(browser.session).to.be.equal(td.WD_SESSION_ID);
                    expect(browser.timeouts.implicit).to.not.be.null;
                    expect(browser.timeouts.pageLoad).to.not.be.null;
                    expect(browser.timeouts.script).to.not.be.null;
                    expect(nock.isDone(), 'all request were executed');
                }
            });

            it('should throw an error if webdriver can\'t create a session | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_500;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                await expect(driver.start(BrowserType[browserType], Capabilities.default)).to.be.rejectedWith(/session : can't create/);
            });
        });

        /*

        describe('window', function () {
            beforeEach(function () {
                nock.cleanAll();
                // Required for session Start
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
                // Required for session Start
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                // Required for .get
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
           });

            describe ('getCurrentWindow', function () {
                it('should return the window\'s handle if the webdriver response is successful', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getCurrentWindow()).to.be.fulfilled;
                });

                it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLE_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getCurrentWindow()).to.be.rejected;
                });                  
            });
            describe ('getAllWindows', function () {
                it('should return the window\'s handle if the webdriver response is successful', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLES_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getAllWindows()).to.be.fulfilled;
                });

                it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLES_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getAllWindows()).to.be.rejected;
                });  
            });
            describe ('current', function (){
                describe('getTitle', async function () {
                    it('should return the title of the windows if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETTITLE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getTitle()).to.become("WD2 Test Page");
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETTITLE.KO;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getTitle()).to.be.rejected;
                    });  
                });

                describe('getSize', function () {
                    it('should modify the windows size if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETSIZE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getSize()).to.be.fulfilled;
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETSIZE.KO;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getSize()).to.be.rejected;
                    });  
                });

                describe('setSize', function () {
                    it('should modify the windows size if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_SETSIZE(1280, 720).OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().setSize(1280, 720)).to.be.fulfilled;
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_SETSIZE(1280, 720).KO;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().setSize(1280, 720)).to.be.rejected;
                    });  
                });
                describe('maximize', function () {

                });
                describe('minimize', function () {

                });
                describe('fullscreen', function () {

                });
                describe('switch', function () {

                });
                describe('screenshot', function () {

                });
            });
            describe ('handle', function () {
                describe('getTitle', function () {
                    it('should return the title of the webpage if the webdriver server response is successful', function() {

                    });
                });
                describe('setSize', function () {

                });
                describe('maximize', function () {

                });
                describe('minimize', function () {

                });
                describe('fullscreen', function () {

                });
                describe('switch', function () {

                });
                describe('screenshot', function () {

                });
            });
        });*/
    });
}