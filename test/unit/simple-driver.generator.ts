import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { Browser, WebDriver, Using, Element } from "../../src/swd";
import { LoggerConfiguration, LogLevel } from "../../src/utils/logger";
import nock from "nock";
import * as td from './data';

chai.use(chaiAsPromised);

let browser = "Chrome";

export function generateSimpleDriverTest(browser : string) { 
    describe('SimpleDriver', function (){ 
        before(function () {
            // Deactivate WebDriver Logs
            LoggerConfiguration.logLevel = LogLevel.Trace;
        });


        afterEach(async function () {
            if (!nock.isActive()) {
                if (browser === "Safari" || browser === "Firefox") // wait 1 sec for Safari or Firefox to avoid "Could not create a session error"
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
                driver = new WebDriver("http://localhost", Browser[browser]);
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with https protocol', function (){ 
                let driver : WebDriver;
                driver = new WebDriver("https://localhost", Browser[browser]);
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with specific port', function (){ 
                let driver : WebDriver;
                driver = new WebDriver("http://localhost:9515", Browser[browser]);
                expect(driver).to.be.not.null;
            });
            it('should create a new simple webdriver with ' + browser, function (){ 
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                expect(driver).to.be.not.null;
            });
        });

        describe('start', function (){
            beforeEach(function () {
                nock.cleanAll();
            });
            it('should throw an exception if the server is not listening', async function () { 
                let driver : WebDriver;
                driver = new WebDriver("http://127.0.0.1:50000", Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/ECONNREFUSED/);
            });
            it('should throw an exception if the server connection is timeouting', async function () { 
                let driver : WebDriver;
                driver = new WebDriver("http://fake-server.local", Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/ENOTFOUND|EAI_AGAIN/);
            }).timeout(10000);
            it('should throw an exception if the server is not a webdriver server 1/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_HTML;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Incorrect HTTP header/);
            });

            it('should throw an exception if the server is not a webdriver server 2/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_EMPTY;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/empty or null/);
            });

            it('should throw an exception if the server is not a webdriver server 3/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NULL;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers)
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/empty or null/);
            });

            it('should throw an exception if the server is not a webdriver server 4/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_EMPTY;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers)
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Missing.*sessionId/);
            });

            it('should throw an exception if the server is not a webdriver server 5/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NO_CAPA;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Missing.*capabilities/);
            });

            /*it('should throw an exception if the server is not a webdriver server 6/6 | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_VALUE_NO_TIMEOUTS;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Missing.*timeouts/);
            });*/

            it('should start a session if webdriver response is correct (http)', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                if (nock.isActive()) {
                    expect(driver.session).to.be.equal(td.WD_SESSION_ID);
                    expect(driver.timeouts.implicit).to.not.be.null;
                    expect(driver.timeouts.pageLoad).to.not.be.null;
                    expect(driver.timeouts.script).to.not.be.null;
                    expect(nock.isDone(), 'all request were executed');
                }
            });

            it('should throw an error if the response is not a JSON object | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_NOJSON;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/Unexpected token/);
            });

            it('should throw an error if the server generate an error during response | Nock Only', async function () { 
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").replyWithError({
                    message: 'something awful happened',
                    code: 'AWFUL_ERROR'});
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/something awful happened/);
            });

            it('should start a session if webdriver response is correct (https) | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTPS[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTPS[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTPS[browser], Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                if (nock.isActive()) {
                    expect(driver.session).to.be.equal(td.WD_SESSION_ID);
                    expect(driver.timeouts.implicit).to.not.be.null;
                    expect(driver.timeouts.pageLoad).to.not.be.null;
                    expect(driver.timeouts.script).to.not.be.null;
                    expect(nock.isDone(), 'all request were executed');
                }
            });

            it('should throw an error if webdriver can\'t create a session | Nock Only', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.KO_500;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                await expect(driver.start()).to.be.rejectedWith(/session : can't create/);
            });

            it('should throw an error if start is called a second time before a stop', async function () { 
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.start()).to.be.rejectedWith(/Can't start Webdriver session which is already started/);
            });

        });

        describe('stop', function () {
            beforeEach(function () {
                nock.cleanAll();
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
            });

            it('should stop the webdriver if the session is created', async function () { 
                let resp = td.WD_STOP_SESSION_RESPONSE.OK;
                //@ts-ignore
                nock(td.WD_SERVER_URL_HTTP[browser]).delete("/session/" + td.WD_SESSION_ID).reply(resp.code, resp.body, resp.headers);
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.stop()).to.be.fulfilled;
                expect(driver.session).to.be.null;
            });

            it('should throw an error if webdriver session was not started', async function () { 
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.stop()).to.be.rejectedWith(/start must be called first/);
            });

            it('should throw an error if webdriver call return an error | Nock Only', async function () {
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                let resp = td.WD_STOP_SESSION_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browser]).delete("/session/" + td.WD_SESSION_ID).reply(resp.code, resp.body, resp.headers);
                await expect(driver.stop()).to.be.rejectedWith(/this is an unknown error/);
            });
        });

        describe('navigate', function () {          
            beforeEach(function () {
                nock.cleanAll();
                // Required for session Start
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                // Required for session Start
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
            })

            describe('to', function () {
                it('should navigate to the website page with no error if result is OK', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                });

                it('should navigate to the website page with no error several times', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'first try').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP_1), 'second try').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP_2), 'third try').to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_TO_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.rejectedWith(/navigate/);
                });
            });

            describe('getCurrentURL', function () {
                beforeEach(function () {
                    // Required for .navigate
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                });

                it('should retreive the website URL with no error if result is OK', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_CURRENTURL.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/url`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().getCurrentURL()).to.become(td.WD_WEBSITE_URL_HTTP);
                });

                it('should navigate to the website page with no error several times', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_CURRENTURL.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/url`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().getCurrentURL(), 'first try').to.become(td.WD_WEBSITE_URL_HTTP);
                    await expect(driver.window().getCurrentURL(), 'second try').to.become(td.WD_WEBSITE_URL_HTTP);
                    await expect(driver.window().getCurrentURL(), 'third try').to.become(td.WD_WEBSITE_URL_HTTP);
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_CURRENTURL.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/url`).twice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().getCurrentURL()).to.be.rejectedWith(/geturl/);
                });
            });

            describe('refresh', function () {
                beforeEach(function () {
                    // Required for .navigate
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                });
                it('should refresh to the website page with no error if result is OK', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp3 = td.WD_NAVIGATE_REFRESH_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/refresh`).reply(resp3.code, resp3.body, resp3.headers);
                    await expect(driver.window().navigate().refresh()).to.be.fulfilled;
                });

                it('should refresh to the website page with no error several times', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_REFRESH_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/refresh`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().refresh()).to.be.fulfilled;
                    await expect(driver.window().navigate().refresh()).to.be.fulfilled;
                    await expect(driver.window().navigate().refresh()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_REFRESH_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/refresh`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().refresh()).to.be.rejectedWith(/refresh/);
                });
            });

            describe('back', function () {
                beforeEach(function () {
                    // Required for .navigate
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                });
                it('should refresh go to the previews web page with no error if result is OK', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/back`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().back()).to.be.fulfilled;
                });

                it('should refresh to go back several times', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/back`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().back()).to.be.fulfilled;
                    await expect(driver.window().navigate().back()).to.be.fulfilled;
                    await expect(driver.window().navigate().back()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/back`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().back()).to.be.rejectedWith(/back/);
                });
            });

            describe('forward', function () {
                beforeEach(function () {
                    // Required for .navigate
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                });
                it('should refresh go to the previews web page with no error if result is OK', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/forward`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().forward()).to.be.fulfilled;
                });

                it('should refresh to go back several times', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/forward`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().forward()).to.be.fulfilled;
                    await expect(driver.window().navigate().forward()).to.be.fulfilled;
                    await expect(driver.window().navigate().forward()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                    await expect(driver.start()).to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/forward`).reply(resp.code, resp.body, resp.headers);
                    await expect(driver.window().navigate().forward()).to.be.rejectedWith(/forward/);
                });
            });
        });

        describe('findElement', function () {
            beforeEach(function () {
                nock.cleanAll();
                // Required for session Start
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                // Required for session Start
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                // Required for .navigate
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
            });

            for (let using in Using) {
                if (using === "className" || using === "id" || using === "name") {
                    it('should return a Element using the execute_sync API with ' + using + ' search', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                        await expect(driver.start()).to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                        let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT;
                        nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(driver.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                } else {
                    it('should return a Element using the element API with ' + using + ' search', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                        await expect(driver.start()).to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                        let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(driver.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                }
            }

            it('should throw an error if the API return an error | Nock Only', async function () {
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(driver.findElement(Using.css, "test")).to.be.rejectedWith(/element : this is an unknown error/);
            });


            it('should throw a LocationError if element can\'t be found', async function () {
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                await expect(driver.findElement(Using.css, "test")).to.be.rejectedWith(/Cannot locate : test/);
            });

            it('should find an element before the timeout  | Nock Only', async function () {
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).times(50).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(driver.findElement(Using.css, ".class_1234", 3000)).to.be.fulfilled;
            });

            it('should thrown an error if element is not found before the timeout', async function () {
                let driver : WebDriver;
                driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser],Browser[browser]);
                await expect(driver.start()).to.be.fulfilled;
                await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).times(100).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(driver.findElement(Using.css, ".class_dont_exist", 50)).to.be.rejectedWith(/Cannot locate :/);
            });

        });

        describe('element', function () {
            beforeEach(function () {
                nock.cleanAll();
                // Required for session Start
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                // Required for session Start
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                // Required for .get
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);

                // Required for .get
                let resp4 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp4.code, resp4.body, resp4.headers);
            });
            describe('click', function () {
                it('should return a success if I click on an existing element ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/click`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.click()).to.be.fulfilled;
                });

                it('should return a throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/click`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.click()).to.be.rejected;
                });
            });

            describe('clear', function () {
                it('should return a success if I clear an existing element ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/clear`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.clear()).to.be.fulfilled;
                });

                it('should return a throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/clear`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.clear()).to.be.rejected;
                });

                it('should return an empty string if the server response was successful ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/clear`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.clear()).to.be.fulfilled;
                    let resp2 = td.WD_ELEMENT_GETVALUE.OK_CLEARED;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp2.code, resp2.body, resp2.headers);
                    await expect(element.getValue()).to.become("");
                });
            });

            describe('sendKeys', function () {
                it('should be successfull if the webdriver server return a response ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_SENDKEYS.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/value`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.sendKeys("test")).to.be.fulfilled;
                });

                it('should return a throw an error if the webdriver server return an error', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_SENDKEYS.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/value`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.sendKeys("test")).to.be.rejected;
                });

                it('should update the text field if the webdriver server return a success ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_SENDKEYS.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/value`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.sendKeys("toto")).to.be.fulfilled;
                    let resp2 = td.WD_ELEMENT_GETVALUE.OK_UPDATED;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp2.code, resp2.body, resp2.headers);
                    if(!nock.isActive() && browser == "Safari")
                        await expect(element.getValue()).to.become("toto");
                    else //Safari seems to clear the input
                        await expect(element.getValue()).to.become("hellototo");
                });
            });
            
            describe('getText', function () {
                it('should return the correct text of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_GETTEXT.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/text`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getText()).to.be.become(td.WD_ELEMENT_GETTEXT.OK.body.value);
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_GETTEXT.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/text`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.clear()).to.be.rejected;
                });
            });

            describe('getValue', function () {
                it('should return the correct text of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETVALUE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getValue()).to.be.become(td.WD_ELEMENT_GETVALUE.OK.body.value);
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETVALUE.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getValue()).to.be.rejected;
                });
            });

            describe('getAttribute', function () {
                it('should return the correct value of the attribute of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETATTRIBUTE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/attribute/${td.WD_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.be.become(td.WD_ELEMENT_GETATTRIBUTE.OK.body.value);
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETATTRIBUTE.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/attribute/${td.WD_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.be.rejected;
                });

                // Different behavior on Safari & Chrome
                it.skip('should not update the property value if the attribute is updated', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_SENDKEYS.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.sendKeys("toto")).to.be.fulfilled;
                    let resp2 = td.WD_ELEMENT_GETATTRIBUTE.OK_UPDATED;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_ATTRIBUTE_NAME}`).reply(resp2.code, resp2.body, resp2.headers);
                    await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.become(td.WD_ELEMENT_GETATTRIBUTE.OK_UPDATED.body.value);
                });
            });

            describe('getProperty', function () {
                it('should return the correct value of the property of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETPROPERTY.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.be.become("hello");
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETPROPERTY.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.be.rejected;
                });

                // On Safari, sendkeys clears the text...
                it.skip('should update the property value if the attribute is updated', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_SENDKEYS.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.sendKeys("toto")).to.be.fulfilled;
                    let resp2 = td.WD_ELEMENT_GETPROPERTY.OK_UPDATED;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp2.code, resp2.body, resp2.headers);
                    await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.become(td.WD_ELEMENT_GETPROPERTY.OK_UPDATED.body.value);
                });
            });

            describe('getTagName', function () {
                it('should return the correct TagName of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETTAGNAME.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/name`).reply(resp.code, resp.body, resp.headers);
                    if (!nock.isActive() && browser == "Safari")
                        await expect(element.getTagName()).to.be.become("INPUT");
                    else
                        await expect(element.getTagName()).to.be.become("input");
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_GETTAGNAME.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/name`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getTagName()).to.be.rejected;
                });
            });

            describe('getCSSValue', function () {
                it('should return the correct CSS property value of the element if webdriver response is successful', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_GETCSSVALUE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/css/${td.WD_CSS_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getCSSValue(td.WD_CSS_ATTRIBUTE_NAME)).to.be.become(td.WD_ELEMENT_GETCSSVALUE.OK.body.value);
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_GETCSSVALUE.KO_NOT_FOUND;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_ELEMENT_ID}css/${td.WD_CSS_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.getCSSValue(td.WD_CSS_ATTRIBUTE_NAME)).to.be.rejected;
                });
            });

            describe('isSelected', function () {
                it('should return false if an element is not selected if webdriver response is successful 1/3', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isSelected()).to.be.become(false);
                });

                it('should return false if an element is selected but not a radio nor checkbox if webdriver response is successful 2/3', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_CLICK.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/click`).reply(resp.code, resp.body, resp.headers);
                    let resp2 = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                    await expect(element.click()).to.be.fulfilled;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp2.code, resp2.body, resp2.headers);
                    await expect(element.isSelected()).to.be.become(false);
                });

                it('should return true if an element is selected and is an option if webdriver response is successful 3/3', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "option");
                    let resp = td.WD_ELEMENT_ISSELECTED.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isSelected()).to.be.become(true);
                });

                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isSelected()).to.be.rejected;
                });
            });

            describe('isEnabled', function () {
                it('should return if an element is enabled if webdriver response is successful 1/2', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "input");
                    let resp = td.WD_ELEMENT_ISENABLED.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isEnabled()).to.be.become(true);
                });

                it('should return if an element is enabled if webdriver response is successful 2/2', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "button");
                    let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isEnabled()).to.be.become(false);
                });


                it('should throw an error if the webdriver server return an error ', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;
                    let element : Element = await driver.findElement(Using.tag, "h1");
                    let resp = td.WD_ELEMENT_ISENABLED.OK_FALSE;
                    //@ts-ignore
                    element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                    await expect(element.isEnabled()).to.be.rejected;
                });
            });

        });

        describe('window', function () {
            beforeEach(function () {
                nock.cleanAll();
                // Required for session Start
                let resp = td.WD_START_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post("/session").reply(resp.code, resp.body, resp.headers);
                // Required for session Start
                let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);
                // Required for .get
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
           });

            describe ('getCurrentWindow', function () {
                it('should return the window\'s handle if the webdriver response is successful', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getCurrentWindow()).to.be.fulfilled;
                });

                it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLE_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getCurrentWindow()).to.be.rejected;
                });                  
            });
            describe ('getAllWindows', function () {
                it('should return the window\'s handle if the webdriver response is successful', async function() {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLES_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getAllWindows()).to.be.fulfilled;
                });

                it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                    let driver : WebDriver;
                    driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                    await expect(driver.start(), 'start').to.be.fulfilled;
                    await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                    let resp = td.WD_WINDOW_HANDLES_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                    await expect(driver.getAllWindows()).to.be.rejected;
                });  
            });
            describe ('current', function (){
                describe('getTitle', async function () {
                    it('should return the title of the windows if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETTITLE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getTitle()).to.become("WD2 Test Page");
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETTITLE.KO;
                        nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getTitle()).to.be.rejected;
                    });  
                });

                describe('getSize', function () {
                    it('should modify the windows size if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETSIZE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getSize()).to.be.fulfilled;
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_GETSIZE.KO;
                        nock(td.WD_SERVER_URL_HTTP[browser]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().getSize()).to.be.rejected;
                    });  
                });

                describe('setSize', function () {
                    it('should modify the windows size if the webdriver server response is successful', async function() {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_SETSIZE(1280, 720).OK;
                        nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                        await expect(driver.window().setSize(1280, 720)).to.be.fulfilled;
                    });
                    it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                        let driver : WebDriver;
                        driver = new WebDriver(td.WD_SERVER_URL_HTTP[browser], Browser[browser]);
                        await expect(driver.start(), 'start').to.be.fulfilled;
                        await expect(driver.window().navigate().to(td.WD_WEBSITE_URL_HTTP), 'navigate to webpage').to.be.fulfilled;     
                        let resp = td.WD_WINDOW_SETSIZE(1280, 720).KO;
                        nock(td.WD_SERVER_URL_HTTP[browser]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
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
        });
    });
}