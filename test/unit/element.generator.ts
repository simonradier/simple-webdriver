import { expect } from "chai";
import nock from "nock";
import { Browser, BrowserType } from "../../src/browser";
import { Element } from "../../src/element";
import { loggerConfiguration, LogLevel } from "../../src/utils/logger";
import { Using, WebDriver } from "../../src/webdriver";
import * as td from './data';


export function generateElementTest(browserType : string) { 
    describe('Element', function (){
        let g_driver : WebDriver = null;
        let g_browser : Browser = null;
        before(async function () {
            // Deactivate WebDriver Logs
            loggerConfiguration.logLevel = LogLevel.Trace;
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
            // Required for Navigation To
            let resp2 = td.WD_NAVIGATE_TO_RESPONSE.OK;
            nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp2.code, resp2.body, resp2.headers);
            await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
            // Required for .finElement
            let resp4 = td.WD_FIND_ELEMENT_RESPONSE.OK;
            nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp4.code, resp4.body, resp4.headers);
        });

        describe('click', function () {
            it('should return a success if I click on an existing element ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/click`).reply(resp.code, resp.body, resp.headers);
                await expect(element.click()).to.be.fulfilled;
            });

            it('should return a throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/click`).reply(resp.code, resp.body, resp.headers);
                await expect(element.click()).to.be.rejected;
            });
        });

        describe('clear', function () {
            it('should return a success if I clear an existing element ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/clear`).reply(resp.code, resp.body, resp.headers);
                await expect(element.clear()).to.be.fulfilled;
            });

            it('should return a throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/clear`).reply(resp.code, resp.body, resp.headers);
                await expect(element.clear()).to.be.rejected;
            });

            it('should return an empty string if the server response was successful ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/clear`).reply(resp.code, resp.body, resp.headers);
                await expect(element.clear()).to.be.fulfilled;
                let resp2 = td.WD_ELEMENT_GETVALUE.OK_CLEARED;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(element.getValue()).to.become("");
            });
        });

        describe('sendKeys', function () {
            it('should be successfull if the webdriver server return a response ', async function () {
                let element : Element = await g_browser .findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SENDKEYS.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/value`).reply(resp.code, resp.body, resp.headers);
                await expect(element.sendKeys("test")).to.be.fulfilled;
            });

            it('should return a throw an error if the webdriver server return an error', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SENDKEYS.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID_FAKE}/value`).reply(resp.code, resp.body, resp.headers);
                await expect(element.sendKeys("test")).to.be.rejected;
            });

            it('should update the text field if the webdriver server return a success ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SENDKEYS.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/value`).reply(resp.code, resp.body, resp.headers);
                await expect(element.sendKeys("toto")).to.be.fulfilled;
                let resp2 = td.WD_ELEMENT_GETVALUE.OK_UPDATED;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp2.code, resp2.body, resp2.headers);
                if(!nock.isActive() && browserType == "Safari")
                    await expect(element.getValue()).to.become("toto");
                else //Safari seems to clear the input
                    await expect(element.getValue()).to.become("hellototo");
            });
        });
        
        describe('getText', function () {
            it('should return the correct text of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_GETTEXT.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/text`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getText()).to.be.become(td.WD_ELEMENT_GETTEXT.OK.body.value);
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_GETTEXT.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/text`).reply(resp.code, resp.body, resp.headers);
                await expect(element.clear()).to.be.rejected;
            });
        });

        describe('getValue', function () {
            it('should return the correct text of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETVALUE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getValue()).to.be.become(td.WD_ELEMENT_GETVALUE.OK.body.value);
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETVALUE.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/value`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getValue()).to.be.rejected;
            });
        });

        describe('getAttribute', function () {
            it('should return the correct value of the attribute of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETATTRIBUTE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/attribute/${td.WD_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.be.become(td.WD_ELEMENT_GETATTRIBUTE.OK.body.value);
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETATTRIBUTE.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/attribute/${td.WD_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.be.rejected;
            });

            // Different behavior on Safari & Chrome
            it.skip('should not update the property value if the attribute is updated', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SENDKEYS.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.sendKeys("toto")).to.be.fulfilled;
                let resp2 = td.WD_ELEMENT_GETATTRIBUTE.OK_UPDATED;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_ATTRIBUTE_NAME}`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(element.getAttribute(td.WD_ATTRIBUTE_NAME)).to.become(td.WD_ELEMENT_GETATTRIBUTE.OK_UPDATED.body.value);
            });
        });

        describe('getProperty', function () {
            it('should return the correct value of the property of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETPROPERTY.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.be.become("hello");
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETPROPERTY.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.be.rejected;
            });

            // On Safari, sendkeys clears the text...
            it.skip('should update the property value if the attribute is updated', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SENDKEYS.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_PROPERTY_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.sendKeys("toto")).to.be.fulfilled;
                let resp2 = td.WD_ELEMENT_GETPROPERTY.OK_UPDATED;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/property/${td.WD_PROPERTY_NAME}`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(element.getProperty(td.WD_PROPERTY_NAME)).to.become(td.WD_ELEMENT_GETPROPERTY.OK_UPDATED.body.value);
            });
        });

        describe('getTagName', function () {
            it('should return the correct TagName of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETTAGNAME.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/name`).reply(resp.code, resp.body, resp.headers);
                if (!nock.isActive() && browserType == "Safari")
                    await expect(element.getTagName()).to.be.become("INPUT");
                else
                    await expect(element.getTagName()).to.be.become("input");
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_GETTAGNAME.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/name`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getTagName()).to.be.rejected;
            });
        });

        describe('getCSSValue', function () {
            it('should return the correct CSS property value of the element if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_GETCSSVALUE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/css/${td.WD_CSS_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getCSSValue(td.WD_CSS_ATTRIBUTE_NAME)).to.be.become(td.WD_ELEMENT_GETCSSVALUE.OK.body.value);
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_GETCSSVALUE.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/${td.WD_ELEMENT_ID}css/${td.WD_CSS_ATTRIBUTE_NAME}`).reply(resp.code, resp.body, resp.headers);
                await expect(element.getCSSValue(td.WD_CSS_ATTRIBUTE_NAME)).to.be.rejected;
            });
        });

        describe('isSelected', function () {
            it('should return false if an element is not selected if webdriver response is successful 1/3', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isSelected()).to.be.become(false);
            });

            it('should return false if an element is selected but not a radio nor checkbox if webdriver response is successful 2/3', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_CLICK.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/click`).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                await expect(element.click()).to.be.fulfilled;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(element.isSelected()).to.be.become(false);
            });

            it('should return true if an element is selected and is an option if webdriver response is successful 3/3', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "option");
                let resp = td.WD_ELEMENT_ISSELECTED.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isSelected()).to.be.become(true);
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/selected`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isSelected()).to.be.rejected;
            });
        });

        describe('findElement', function () {
            let l_element : Element;
            let l_elementId : string;
            beforeEach(async function () {
                // Required for .navigate.to()
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
                let resp = td.WD_FIND_ELEMENTS_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                l_element = await g_browser.findElement(Using.tag, "body");
                l_elementId = l_element.toString();
            });

            for (let using in Using) {
                if (using === "className" || using === "id" || using === "name") {
                    it('should return a Element using the execute_sync API with ' + using + ' search', async function () {
                        let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(l_element.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                } else {
                    it('should return a Element using the element API with ' + using + ' search', async function () {
                        let resp = td.WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(l_element.findElement(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                }
            }

            it('should throw an error if the API return an error | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(l_element.findElement(Using.css, "test")).to.be.rejectedWith(/element : this is an unknown error/);
            });


            it('should throw a LocationError if element can\'t be found', async function () {
                let resp = td.WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).reply(resp.code, resp.body, resp.headers);
                await expect(l_element.findElement(Using.css, "test")).to.be.rejectedWith(/Cannot locate : test/);
            });

            it('should find an element before the timeout  | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).times(50).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(l_element.findElement(Using.css, ".class_1234", 3000)).to.be.fulfilled;
            });

            it('should thrown an error if element is not found before the timeout', async function () {
                let resp = td.WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).times(100).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/element`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(l_element.findElement(Using.css, ".class_dont_exist", 50)).to.be.rejectedWith(/Cannot locate :/);
            });

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(l_element.findElement(Using.css, ".class_1234", 3000)).to.be.rejected;
            });
        });

        describe('findElements', function () {
            let l_element : Element;
            let l_elementId : string;
            beforeEach(async function () {
                // Required for .navigate.to()
                let resp3 = td.WD_NAVIGATE_TO_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/url`).reply(resp3.code, resp3.body, resp3.headers);
                await g_browser.navigate().to(td.WD_WEBSITE_URL_HTTP);
                let resp = td.WD_FIND_ELEMENTS_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element`).reply(resp.code, resp.body, resp.headers);
                l_element = await g_browser.findElement(Using.tag, "body");
                l_elementId = l_element.toString();
            });

            for (let using in Using) {
                if (using === "className" || using === "id" || using === "name") {
                    it('should return a Element using the execute_sync API with ' + using + ' search', async function () {
                        let resp = td.WD_EXECUTE_SYNC_RESPONSE.OK_ELEMENT;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/execute/sync`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(l_element.findElements(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                } else {
                    it('should return a Element using the element API with ' + using + ' search', async function () {
                        let resp = td.WD_FIND_ELEMENT_RESPONSE.OK;
                        nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).reply(resp.code, resp.body, resp.headers);
                        //@ts-ignore
                        await expect(l_element.findElements(Using[using], td.WD_ELEMENT_SEARCH[using])).to.be.fulfilled;
                    });
                }
            }

            it('should throw an error if the API return an error | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_ERROR;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).reply(resp.code, resp.body, resp.headers);
                //@ts-ignore
                await expect(l_element.findElements(Using.css, "test")).to.be.rejectedWith(/element : this is an unknown error/);
            });


            it('should throw a LocationError if element can\'t be found', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).reply(resp.code, resp.body, resp.headers);
                await expect(l_element.findElements(Using.css, "test")).to.be.rejectedWith(/Cannot locate : test/);
            });

            it('should find an element before the timeout  | Nock Only', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).times(50).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(l_element.findElements(Using.css, ".class_1234", 3000)).to.be.fulfilled;
            });

            it('should thrown an error if element is not found before the timeout', async function () {
                let resp = td.WD_FIND_ELEMENT_RESPONSE.KO_NOT_FOUND;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).times(100).reply(resp.code, resp.body, resp.headers);
                let resp2 = td.WD_FIND_ELEMENT_RESPONSE.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).post(`/session/${td.WD_SESSION_ID}/element/${l_elementId}/elements`).reply(resp2.code, resp2.body, resp2.headers);
                await expect(l_element.findElements(Using.css, ".class_dont_exist", 50)).to.be.rejectedWith(/Cannot locate :/);
            });

            it('should throw an error if browser is closed', async function() {
                //@ts-ignore required for test purpose
                g_browser._closed = true;
                await expect(l_element.findElements(Using.css, ".class_1234", 3000)).to.be.rejected;
            });
        });

        describe('isEnabled', function () {
            it('should return if an element is enabled if webdriver response is successful 1/2', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_ISENABLED.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isEnabled()).to.be.become(true);
            });

            it('should return if an element is enabled if webdriver response is successful 2/2', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "button");
                let resp = td.WD_ELEMENT_ISSELECTED.OK_FALSE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isEnabled()).to.be.become(false);
            });


            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_ISENABLED.OK_FALSE;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                await expect(element.isEnabled()).to.be.rejected;
            });
        });

        describe('screenshot', function () {
            it('should return the image base 64 of the element is enabled if webdriver response is successful', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "input");
                let resp = td.WD_ELEMENT_SCREENSHOT.OK;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/screenshot`).reply(resp.code, resp.body, resp.headers);
                await expect(element.screenshot()).to.be.fulfilled;
            });

            it('should throw an error if the webdriver server return an error ', async function () {
                let element : Element = await g_browser.findElement(Using.tag, "h1");
                let resp = td.WD_ELEMENT_SCREENSHOT.KO_NOT_FOUND;
                //@ts-ignore
                element['element-6066-11e4-a52e-4f735466cecf'] = td.WD_ELEMENT_ID_FAKE;
                nock(td.WD_SERVER_URL_HTTP[browserType]).get(`/session/${td.WD_SESSION_ID}/element/${td.WD_ELEMENT_ID}/enabled`).reply(resp.code, resp.body, resp.headers);
                await expect(element.screenshot()).to.be.rejected;
            });
        });   
    });
}