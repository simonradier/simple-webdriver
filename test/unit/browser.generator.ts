import { expect } from "chai";
import nock from "nock";
import { Browser, BrowserType } from "../../src/browser";
import { LoggerConfiguration, LogLevel } from "../../src/utils/logger";
import { Using, WebDriver } from "../../src/webdriver";
import { WindowType } from "../../src/window";
import * as td from './data';


export function generateBrowserTest(browserType : string) { 
    describe('Browser', function (){
        let g_driver : WebDriver = null;
        let g_browser : Browser = null;
        before(async function () {
            // Deactivate WebDriver Logs
            LoggerConfiguration.logLevel = LogLevel.Trace;
            // Clean previous sessions
            await WebDriver.cleanSessions();
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
            it('should close the browser and the associated windows if the webdriver response is successful', async function() {
                let resp = td.WD_STOP_SESSION_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.close()).to.be.fulfilled;
                expect(g_browser.closed).to.be.true;
            }); 

            it('should throw an error if the webdriver server return an error | Nock Only', async function () {
                let resp = td.WD_STOP_SESSION_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.close()).to.be.rejected;
            });    

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.close()).to.be.rejectedWith(/closed/);
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
            
            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.getCurrentWindow()).to.be.rejectedWith(/closed/);;
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

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.getTitle()).to.be.rejectedWith(/closed/);;
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

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.getAllWindows()).to.be.rejectedWith(/closed/);;
            });
        });

        describe('newWindow', function () {
            it('should open a new window  if the webdriver response is successful (new Window)', async function() {  
                let resp = td.WD_WINDOW_OPEN.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/new`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.newWindow(WindowType.Window)).to.be.fulfilled;
            });

            it('should open a new window  if the webdriver response is successful (new Window)', async function() {  
                let resp = td.WD_WINDOW_OPEN.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/new`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.newWindow(WindowType.Tab)).to.be.fulfilled;
            });

            it('should throw an error if the webdriver server return an error | Nock Only', async function () {  
                let resp = td.WD_WINDOW_OPEN.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/new`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.newWindow(WindowType.Tab)).to.be.rejected;
            });  

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.newWindow(WindowType.Tab)).to.be.rejectedWith(/closed/);
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

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.findElement(Using.css, ".class_1234", 3000)).to.be.rejected;
            });
        });

        describe('executeSync', function () {
            it('should execute the function and return the correct value if webdriver response is successful (1)', async function() {
                let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_STRING;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeSync(() => { return "hello"; })).to.be.fulfilled;
                let val = await g_browser.executeSync(() => { return "hello"; });
                expect(val).to.be.equal("hello");
            }); 

            it('should execute the function and return the correct value if webdriver response is successful (2)', async function() {
                let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_NUMBER;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeSync(() => { return 10; })).to.be.fulfilled;
                let val = await g_browser.executeSync(() => { return 10 });
                expect(val).to.be.equal(10);                
            }); 

            it('should execute the function and return the correct value if webdriver response is successful (3)', async function() {
                let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ARRAY;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeSync(() => { return [1,2,3]; })).to.be.fulfilled;
                let val = await g_browser.executeSync(() => { return [1,2,3] });
                expect(val.length).to.be.equal(3);              
            }); 

            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_EXECUTE_SYNC_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/execute/sync`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.executeSync("return 0")).to.be.rejected;
            });  

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.executeSync("return 0")).to.be.rejectedWith(/closed/);
            });
        });

        describe('executeAsync', function () {
            it('should execute the function and return the correct value if webdriver response is successful (1)', async function() {
                let resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_STRING;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/async`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeAsync((done) => { done("hello"); })).to.be.fulfilled;
                let val = await g_browser.executeAsync((done) => { done("hello"); });
                expect(val).to.be.equal("hello");
            }); 

            it('should execute the function and return the correct value if webdriver response is successful (2)', async function() {
                let resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_NUMBER;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/async`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeAsync((done) => { done(10); })).to.be.fulfilled;
                let val = await g_browser.executeAsync((done) => { done(10); });
                expect(val).to.be.equal(10);                
            }); 

            it('should execute the function and return the correct value if webdriver response is successful (3)', async function() {
                let resp = td.WD_EXECUTE_ASYNC_RESPONSE.OK_ARRAY;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/async`).twice().reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(g_browser.executeAsync((done) => { done([1,2,3]); })).to.be.fulfilled;
                let val = await g_browser.executeAsync((done) => { done([1,2,3]); });
                expect(val.length).to.be.equal(3);              
            }); 

            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_EXECUTE_ASYNC_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/execute/async`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_browser.executeAsync("return 0")).to.be.rejected;
            });  

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(g_browser.executeAsync("return 0")).to.be.rejectedWith(/closed/);
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
    
                it('should throw an error if browser is closed', async function() {
                    //@ts-ignore required for test purpose
                    g_browser._closed = true;
                    expect(() => {g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP)}).to.throw(/closed/);
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
                    await expect(g_browser.navigate().getCurrentURL()).to.become(td.WD_WEBSITE_URL_HTTP);
                });
    
                it('should navigate to the website page with no error several times', async function() {
                    let resp = td.WD_NAVIGATE_CURRENTURL.OK;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/url`).thrice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().getCurrentURL(), 'first try').to.become(td.WD_WEBSITE_URL_HTTP);
                    await expect(g_browser.navigate().getCurrentURL(), 'second try').to.become(td.WD_WEBSITE_URL_HTTP);
                    await expect(g_browser.navigate().getCurrentURL(), 'third try').to.become(td.WD_WEBSITE_URL_HTTP);
                });
    
                it('should thrown an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_CURRENTURL.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/url`).twice().reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().getCurrentURL()).to.be.rejectedWith(/geturl/);
                });

                it('should throw an error if browser is closed', async function() {
                    //@ts-ignore required for test purpose
                    g_browser._closed = true;
                    expect(() => {g_browser.navigate().getCurrentURL()}).to.throw(/closed/);
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

                it('should throw an error if browser is closed', async function() {
                    //@ts-ignore required for test purpose
                    g_browser._closed = true;
                    expect(() => {g_browser.navigate().refresh()}).to.throw(/closed/);;
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

                it('should throw an error if the webdriver server return an error | Nock Only', async function() {
                    let resp = td.WD_NAVIGATE_BACK_RESPONSE.KO;
                    nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/back`).reply(resp.code, resp.body, resp.headers);
                    await expect(g_browser.navigate().back()).to.be.rejectedWith(/back/);
                });

                it('should throw an error if browser is closed', async function() {
                    //@ts-ignore required for test purpose
                    g_browser._closed = true;
                    expect(() => {g_browser.navigate().back()}).to.throw(/closed/);
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

                it('should throw an error if browser is closed', async function() {
                    //@ts-ignore required for test purpose
                    g_browser._closed = true;
                    expect(() => {g_browser.navigate().forward()}).to.throw(/closed/);
                });
            });        
        });
    });
}