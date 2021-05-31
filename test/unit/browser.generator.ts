import { expect } from "chai";
import nock from "nock";
import { Browser, BrowserType } from "../../src/browser";
import { LoggerConfiguration, LogLevel } from "../../src/utils/logger";
import { Using, WebDriver } from "../../src/webdriver";
import * as td from './data';


export function generateBrowserTest(browserType : string) { 
    describe('Browser', function (){
        let g_driver : WebDriver = null;
        let g_browser : Browser = null;
        before(function () {
            // Deactivate WebDriver Logs
            LoggerConfiguration.logLevel = LogLevel.Trace;
            g_driver = new WebDriver(td.WD_SERVER_URL_HTTP[browserType]);
        });


        afterEach(async function () {
            if (!nock.isActive()) {
                if (browserType === "Safari" || browserType === "Firefox") // wait 1.5 sec for Safari or Firefox to avoid "Could not create a session error"
                    await (new Promise(resolve => setTimeout(resolve, 1500)))
                await WebDriver.cleanSessions();
            }
        });

        beforeEach(async function () {
            nock.cleanAll();
            // Required for session Start
            let resp = td.WD_START_SESSION_RESPONSE.OK;
            nock(td.WD_SERVER_URL_HTTP[browserType]).post("/session").reply(resp.code, resp.body, resp.headers);
            g_browser = await g_driver.start(BrowserType[browserType]);
        });

        describe('close', function () {
            it('', async function() {

            }); 
        });

        describe('setCurrentWindow', function () {
            it('', async function() {

            }); 
        });

        describe ('getCurrentWindow', function () {
            it('should return the window\'s handle if the webdriver response is successful', async function() { 
                let resp = td.WD_WINDOW_HANDLE_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getCurrentWindow()).to.be.fulfilled;
            });

            it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                let resp = td.WD_WINDOW_HANDLE_RESPONSE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getCurrentWindow()).to.be.rejected;
            });                  
        });

        describe('getCurrentURL', function () {
            beforeEach(async function () {
                // Required for .navigate
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
            });

            it('should retreive the website URL with no error if result is OK', async function() {
                let resp = td.WD_NAVIGATE_CURRENTURL.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/url`).reply(resp.code, resp.body, resp.headers);
                await expect(g_browser.getCurrentURL()).to.become(td.WD_WEBSITE_URL_HTTP);
            });

            it('should navigate to the website page with no error several times', async function() {
                let resp = td.WD_NAVIGATE_CURRENTURL.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/url`).thrice().reply(resp.code, resp.body, resp.headers);
                await expect(g_browser.getCurrentURL(), 'first try').to.become(td.WD_WEBSITE_URL_HTTP);
                await expect(g_browser.getCurrentURL(), 'second try').to.become(td.WD_WEBSITE_URL_HTTP);
                await expect(g_browser.getCurrentURL(), 'third try').to.become(td.WD_WEBSITE_URL_HTTP);
            });

            it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                let resp = td.WD_NAVIGATE_CURRENTURL.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/url`).twice().reply(resp.code, resp.body, resp.headers);
                await expect(g_browser.getCurrentURL()).to.be.rejectedWith(/geturl/);
            });
        });

        describe('getTitle', async function () {
            beforeEach(async function () {
                // Required for .navigate
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
            });

            it('should return the title of the windows if the webdriver server response is successful', async function() {  
                let resp = td.WD_WINDOW_GETTITLE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getTitle()).to.become("WD2 Test Page");
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_GETTITLE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/title`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getTitle()).to.be.rejected;
            });  
        });

        describe ('getAllWindows', function () {
            it('should return the window\'s handle if the webdriver response is successful', async function() {  
                let resp = td.WD_WINDOW_HANDLES_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getAllWindows()).to.be.fulfilled;
            });

            it('should throw an error if the webdriver server return an error | Nock Only', async function () {  
                let resp = td.WD_WINDOW_HANDLES_RESPONSE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/handles`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.getAllWindows()).to.be.rejected;
            });  
        });

        describe('newWindow', function () {
            it('', async function() {

            }); 
        });

        describe('findElement', function () {
            beforeEach(async function () {
                // Required for .navigate.to()
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
            });

            for (let using in Using) {
                if (using === "className" || using === "id" || using === "name") {
                    it('should return a Element using the execute_sync API with ' + using + ' search', async function () {
                        let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(g_browser.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                } else {
                    it('should return a Element using the element API with ' + using + ' search', async function () {
                        let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(g_browser.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                }
            }

            it('should throw an error if the API return an error | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.findElement(Using.css, "test")).to.be.rejectedWith(/element : this is an unknown error/);
            });


            it('should throw a LocationError if element can\'t be found', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                await expect(g_browser.findElement(Using.css, "test")).to.be.rejectedWith(/Cannot locate : test/);
            });

            it('should find an element before the timeout  | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).times(50).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(g_browser.findElement(Using.css, ".class_1234", 3000)).to.be.fulfilled;
            });

            it('should thrown an error if element is not found before the timeout', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).times(100).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(g_browser.findElement(Using.css, ".class_dont_exist", 50)).to.be.rejectedWith(/Cannot locate :/);
            });
        });

        describe('executeSync', function () {
            it('', async function() {

            }); 
        });

        describe('executeAsync', function () {
            it('', async function() {

            }); 
        });

        describe('navigate', function() {


            describe('to', function () {
                it('should navigate to the website page with no error if result is OK', async function() {
                    let resp = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.fulfilled;
                });

                it('should navigate to the website page with no error several times', async function() {
                    let resp = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP), 'first try').to.be.fulfilled;
                    await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP_1), 'second try').to.be.fulfilled;
                    await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP_2), 'third try').to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_TO_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)).to.be.rejectedWith(/navigate/);
                });
            });


            describe('refresh', function () {
                beforeEach(async function () {
                    // Required for .navigate.to()
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                    await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
                })
                it('should refresh to the website page with no error if result is OK', async function() {
                    let resp3 = td.WD_NAVIGATE_REFRESH_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/refresh`).reply(resp3.code, resp3.body, resp3.headers);
                    await expect(g_browser.navigate().refresh()).to.be.fulfilled;
                });

                it('should refresh to the website page with no error several times', async function() {
                    let resp = td.WD_NAVIGATE_REFRESH_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/refresh`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().refresh()).to.be.fulfilled;
                    await expect(g_browser.navigate().refresh()).to.be.fulfilled;
                    await expect(g_browser.navigate().refresh()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_REFRESH_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/refresh`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().refresh()).to.be.rejectedWith(/refresh/);
                });
            });

            describe('back', function () {
                beforeEach(async function () {
                    // Required for .navigate.to()
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                    await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
                })
                it('should refresh go to the previews web page with no error if result is OK', async function() {
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/back`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().back()).to.be.fulfilled;
                });

                it('should refresh to go back several times', async function() {
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/back`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().back()).to.be.fulfilled;
                    await expect(g_browser.navigate().back()).to.be.fulfilled;
                    await expect(g_browser.navigate().back()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/back`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().back()).to.be.rejectedWith(/back/);
                });
            });

            describe('forward', function () {
                beforeEach(async function () {
                    // Required for .navigate.to()
                    let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                    await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
                })
                it('should refresh go to the previews web page with no error if result is OK', async function() {
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/forward`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().forward()).to.be.fulfilled;
                });

                it('should refresh to go back several times', async function() {
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/forward`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().forward()).to.be.fulfilled;
                    await expect(g_browser.navigate().forward()).to.be.fulfilled;
                    await expect(g_browser.navigate().forward()).to.be.fulfilled;
                });

                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_FORWARD_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/forward`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().forward()).to.be.rejectedWith(/forward/);
                });
            });        
        });
    });
}