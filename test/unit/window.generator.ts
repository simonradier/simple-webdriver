import { expect } from "chai";
import nock from "nock";
import { LoggerConfiguration, LogLevel } from "../../src/utils/logger";
import { Window, Browser, BrowserType, WebDriver } from "../../src/swd";
import * as td from './data';


export function generateWindowTest(browserType : string) { 
    describe('Windows', function (){
        let g_driver : WebDriver = null;
        let g_browser : Browser = null;
        let g_window : Window = null;
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
            let resp2 = td.WD_WINDOW_HANDLE_RESPONSE.OK;
            nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window`).reply(resp2.code, resp2.body, resp2.headers);    
            g_window =  await g_browser.getCurrentWindow();
            let resp3 = td.WD_WINDOW_SWITCH.OK;
            nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window`).reply(resp3.code, resp3.body, resp3.headers);  
        });

        describe('getSize', function () {
            it('should modify the windows size if the webdriver server response is successful', async function() {
                let resp = td.WD_WINDOW_GETSIZE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.getSize()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () {   
                let resp = td.WD_WINDOW_GETSIZE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.getSize()).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect(g_window.close()).to.be.fulfilled;                        
                await expect(g_window.getSize()).to.be.rejected;
            });              
        });

        describe('setSize', function () {
            it('should modify the windows size if the webdriver server response is successful', async function() {  
                let resp = td.WD_WINDOW_SETSIZE(1280, 720).OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.setSize(1280, 720)).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_SETSIZE(1280, 720).KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/rect`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.setSize(1280, 720)).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.setSize(1280, 720)).to.be.rejected;
            });  
        });
        
        describe('maximize', function () {
            it('should maximize the windows if the webdriver server response is successful', async function() {  
                let resp = td.WD_WINDOW_MAXIMIZE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/maximize`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.maximize()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_MAXIMIZE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/maximize`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.maximize()).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.maximize()).to.be.rejected;
            });  
        });

        describe('minimize', function () {
            it('should minimize the windows if the webdriver server response is successful', async function() {  
                if (process.platform == "linux")
                    return;
                let resp = td.WD_WINDOW_MINIMIZE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/minimize`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.minimize()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_MINIMIZE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/minimize`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.minimize()).to.be.rejected;
            }); 
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.minimize()).to.be.rejected;
            });   
        });
        describe('fullscreen', function () {
            it('should fullscreen the windows if the webdriver server response is successful', async function() {  
                let resp = td.WD_WINDOW_FULLSCREEN.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/fullscreen`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.fullscreen()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_FULLSCREEN.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window/fullscreen`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.fullscreen()).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.fullscreen()).to.be.rejected;
            });  
        });
        describe('switch', function () {
            it('should switch to the window if the webdriver server response is successful  | Nock Only', async function() {  
                let resp = td.WD_WINDOW_SWITCH.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.switch()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                nock.cleanAll();
                let resp = td.WD_WINDOW_SWITCH.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.switch()).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.switch()).to.be.rejected;
            });  
        });

        describe('close', function () {
            it('should close the window if the webdriver server response is successful  | Nock Only', async function() {  
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.close()).to.be.fulfilled;
            });
            it('should throw an error if the webdriver server return an error | Nock Only', async function () { 
                let resp = td.WD_WINDOW_CLOSE.KO;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);                          
                await expect(g_window.close()).to.be.rejected;
            });  
            it('should throw an error if the window is closed', async function () { 
                let resp = td.WD_WINDOW_CLOSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).delete(`/session/${td.WD_SESSION_ID}/window`).reply(resp.code, resp.body, resp.headers);   
                await expect (g_window.close()).to.be.fulfilled;                        
                await expect(g_window.close()).to.be.rejected;
            });  
        });

        describe('toString', function () {
            it('should return the current handle of the window  | Nock Only', function() {  
                expect(g_window.toString()).to.be.equals(td.WD_WINDOW_ID);
            });
        });
    });
}