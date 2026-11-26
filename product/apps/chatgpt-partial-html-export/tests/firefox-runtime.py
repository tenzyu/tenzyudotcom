"""Real Firefox + WebExtension APIs; synthetic loopback HTML only, no account."""
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ID = "chatgpt-partial-html-export@tenzyudotcom.local"

def until(fn, description, seconds=30):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        result = fn()
        if result:
            return result
        time.sleep(.1)
    raise AssertionError(description)

def main():
    with tempfile.TemporaryDirectory(prefix="cphe-firefox-") as tmp:
        root = Path(tmp)
        home = root / "home"
        downloads = root / "downloads"
        native = root / "native"
        for p in (home, downloads, native):
            p.mkdir()
        env = {**os.environ, "HOME": str(home)}
        subprocess.run(["node", str(ROOT / "scripts/install-native-host.mjs")], env=env, check=True, timeout=30)
        manifest = json.loads((ROOT / "manifest.json").read_text())
        assert set(manifest["permissions"]) == {"downloads", "nativeMessaging", "storage", "clipboardWrite", "https://chatgpt.com/*", "https://chat.openai.com/*"}
        assert manifest["browser_specific_settings"]["gecko"]["id"] == ID
        # Only the fixture host scope and test-only options tab placement differ.
        local = "http://127.0.0.1/*"
        manifest["permissions"] = [p for p in manifest["permissions"] if not p.startswith("https://")] + [local]
        manifest["content_scripts"][0]["matches"] = [local]
        # Test-only locator, not a mock of the production extension API.
        manifest["content_scripts"][0]["js"].append("fixture-locator.js")
        manifest["background"]["scripts"].append("fixture-background.js")
        manifest["options_ui"]["open_in_tab"] = True
        xpi = root / "fixture.xpi"
        with zipfile.ZipFile(xpi, "w") as z:
            z.writestr("manifest.json", json.dumps(manifest))
            z.writestr("fixture-background.js", """browser.runtime.onMessage.addListener(message => {
              if (message?.type === 'CPHE_FIXTURE_OPEN_OPTIONS') return browser.runtime.openOptionsPage().then(() => true);
              return false;
            });""")
            z.writestr("fixture-locator.js", """document.addEventListener('fixture-open-options', async () => {
              try {
                await browser.runtime.sendMessage({ type: 'CPHE_FIXTURE_OPEN_OPTIONS' });
                document.documentElement.dataset.fixtureOptions = 'opened';
              } catch (error) { document.documentElement.dataset.fixtureOptions = String(error); }
            });
            document.addEventListener('fixture-options-command', async () => {
              const root = document.documentElement;
              try {
                const response = await browser.runtime.sendMessage({
                  type: 'CPHE_FIXTURE_OPTIONS_COMMAND',
                  ...JSON.parse(root.dataset.fixtureCommand)
                });
                root.dataset.fixtureResponse = JSON.stringify(response ?? { pending: true });
              } catch (error) { root.dataset.fixtureResponse = JSON.stringify({ error: String(error) }); }
            });
            document.addEventListener('fixture-malformed-export', async () => {
              try {
                await browser.runtime.sendMessage({ type: 'CPHE_EXPORT_HTML', payload: { html: 42 } });
                document.documentElement.dataset.fixtureMalformed = 'unexpected success';
              } catch (error) { document.documentElement.dataset.fixtureMalformed = String(error); }
            });""")
            # Marionette refuses commands on privileged extension browsing contexts.
            # The probe runs inside the real options DOM, using production listeners;
            # it neither mocks browser APIs nor calls storage directly.
            z.writestr("options/fixture-options.js", """(() => {
              const wait = async (predicate) => {
                for (let i = 0; i < 100; i++) {
                  if (predicate()) return;
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                throw new Error('Options DOM did not settle');
              };
              const selected = () => document.querySelector('input[name=exportMode]:checked');
              const status = () => document.querySelector('#status').textContent;
              browser.runtime.onMessage.addListener(message => {
                if (message?.type !== 'CPHE_FIXTURE_OPTIONS_COMMAND') return false;
                return (async () => {
                  await wait(selected);
                  if (message.action === 'native') {
                    document.querySelector('input[name=exportMode][value=native]').click();
                    document.querySelector('#nativeOutputDir').value = message.directory;
                    if (document.querySelector('#fallbackToDownload').checked) {
                      document.querySelector('#fallbackToDownload').click();
                    }
                    document.querySelector('button[type=submit]').click();
                    await wait(() => status() === 'Saved.');
                  } else if (message.action === 'restore') {
                    document.querySelector('#restoreDefaults').click();
                    await wait(() => status() === 'Restored defaults.');
                  } else if (message.action !== 'snapshot') {
                    throw new Error('Unknown fixture action');
                  }
                  return { origin: location.protocol, mode: selected().value,
                    directory: document.querySelector('#nativeOutputDir').value,
                    fallback: document.querySelector('#fallbackToDownload').checked,
                    status: status() };
                })();
              });
            })();""")
            for folder in ("src", "options", "popup"):
                for p in (ROOT / folder).rglob("*"):
                    if p.is_file():
                        relative = str(p.relative_to(ROOT))
                        if relative == "options/options.html":
                            html = p.read_text()
                            assert "</body>" in html
                            z.writestr(relative, html.replace("</body>", '<script src="fixture-options.js"></script></body>'))
                        else:
                            z.write(p, relative)
        class Fixture(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                body = """<!doctype html><title>Fixture conversation</title>
                <article><div data-message-author-role="user">EXCLUDED_FIRST</div></article>
                <article><div data-message-author-role="assistant"><p>INCLUDED_SECOND</p><button>EXCLUDED_CONTROL</button><script>/* EXCLUDED_SCRIPT */</script></div></article>
                <article><div data-message-author-role="user">INCLUDED_THIRD 日本語</div></article>""".encode()
                if self.path == "/large":
                    body = body.replace(b"INCLUDED_SECOND", b"INCLUDED_SECOND " + b"LARGE_CHUNK " * 32768)
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(body)
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Fixture)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f"http://127.0.0.1:{server.server_port}"
        with open(root / "driver.log", "w+") as log:
            driver = subprocess.Popen(["geckodriver", "--host", "127.0.0.1", "--port", "4445"], env=env, stdout=log, stderr=log)
            endpoint = "http://127.0.0.1:4445"
            session = None
            def request(method, path, body=None):
                data = json.dumps(body).encode() if body is not None else None
                req = urllib.request.Request(endpoint + path, data=data, method=method, headers={"Content-Type":"application/json"})
                try:
                    with urllib.request.urlopen(req, timeout=60) as response:
                        return json.load(response)["value"]
                except urllib.error.HTTPError as error:
                    raise RuntimeError(error.read().decode()) from error
            def ready():
                try: return request("GET", "/status").get("ready")
                except OSError: return False
            try:
                until(ready, "geckodriver ready")
                created = request("POST", "/session", {"capabilities":{"alwaysMatch":{"browserName":"firefox","moz:firefoxOptions":{"args":["-headless"],"prefs":{"browser.download.folderList":2,"browser.download.dir":str(downloads),"browser.download.useDownloadDir":True,"browser.helperApps.neverAsk.saveToDisk":"text/html","network.proxy.type":0}}}}})
                session = "/session/" + created["sessionId"]
                print(json.dumps({"browser":created["capabilities"].get("browserVersion"),"driver":created["capabilities"].get("moz:geckodriverVersion")}))
                request("POST", session + "/moz/addon/install", {"path":str(xpi),"temporary":True})
                def go(url): request("POST", session + "/url", {"url":url})
                def js(script, *args): return request("POST", session + "/execute/sync", {"script":script,"args":list(args)})
                def element(selector):
                    return request("POST", session + "/element", {"using":"css selector","value":selector})["element-6066-11e4-a52e-4f735466cecf"]
                def click(selector):
                    request("POST", session + "/element/" + element(selector) + "/click", {})
                def windows():
                    return set(request("GET", session + "/window/handles"))
                def switch(handle):
                    request("POST", session + "/window", {"handle":handle})
                def options_command(action, directory="", readiness=False):
                    js("""const root = document.documentElement;
                        delete root.dataset.fixtureResponse;
                        root.dataset.fixtureCommand = JSON.stringify(arguments[0]);
                        document.dispatchEvent(new Event('fixture-options-command'));""",
                       {"action": action, "directory": directory})
                    response = json.loads(until(
                        lambda: js("return document.documentElement.dataset.fixtureResponse"),
                        "options probe response"))
                    if readiness and (response.get("pending") or
                            "Receiving end does not exist" in response.get("error", "")):
                        return None
                    assert response.get("origin") == "moz-extension:", response
                    return response
                def with_options(action, directory=""):
                    go(origin)
                    until(lambda: js("return document.querySelectorAll('.cphe-export-button').length === 3"), "fixture ready")
                    previous = request("GET", session + "/window")
                    before = windows()
                    js("document.dispatchEvent(new Event('fixture-open-options'))")
                    opened = until(lambda: windows() - before, "extension opened real options tab")
                    assert len(opened) == 1
                    handle = opened.pop()
                    switch(previous)
                    try:
                        until(lambda: options_command("snapshot", readiness=True), "options DOM loaded")
                        return options_command(action, directory)
                    finally:
                        switch(handle)
                        request("DELETE", session + "/window")
                        switch(previous)
                def configure_native(directory, restore=False):
                    action = "restore" if restore else "native"
                    saved = with_options(action, directory)
                    expected = "download" if restore else "native"
                    assert saved["status"] == ("Restored defaults." if restore else "Saved."), saved
                    # A newly opened page must render the persisted settings.
                    reopened = with_options("snapshot")
                    assert saved["mode"] == reopened["mode"] == expected, (saved, reopened)
                    assert saved["directory"] == reopened["directory"] == ("" if restore else directory)
                    assert saved["fallback"] == reopened["fallback"] == restore
                def click_second(path=""):
                    go(origin + path)
                    until(lambda: js("return document.querySelectorAll('.cphe-export-button').length === 3"), "three injected buttons")
                    js("window.__button=document.querySelectorAll('.cphe-export-button')[1]")
                    time.sleep(.8)
                    assert js("return window.__button===document.querySelectorAll('.cphe-export-button')[1]"), "injection must settle"
                    click(".cphe-export-button[data-cphe-index='1']")
                def verify(folder):
                    files = until(lambda: [p for p in folder.rglob("*.html") if p.stat().st_size > 0], "exported file")
                    data = files[0].read_text()
                    assert "INCLUDED_SECOND" in data and "INCLUDED_THIRD 日本語" in data
                    assert all(x not in data for x in ("EXCLUDED_FIRST","EXCLUDED_CONTROL","EXCLUDED_SCRIPT"))
                click_second()
                verify(downloads)
                configure_native(str(native))
                click_second()
                verify(native)
                until(lambda: js("return document.querySelector('.cphe-toast')?.textContent.startsWith('Exported HTML:')"), "native success acknowledged")
                downloads_before = set(downloads.rglob("*.html"))
                native_before = set(native.rglob("*.html"))
                configure_native("relative/not-allowed")
                click_second()
                until(lambda: js("return document.querySelector('.cphe-toast')?.textContent.includes('Native export failed')"), "native failure visible")
                assert set(downloads.rglob("*.html")) == downloads_before, "fallback is disabled"
                assert set(native.rglob("*.html")) == native_before
                configure_native(str(native))
                go(origin)
                until(lambda: js("return document.querySelectorAll('.cphe-export-button').length === 3"), "fixture ready")
                js("document.dispatchEvent(new Event('fixture-malformed-export'))")
                malformed = until(lambda: js("return document.documentElement.dataset.fixtureMalformed"), "malformed response")
                assert "Invalid export payload" in malformed, malformed
                assert set(downloads.rglob("*.html")) == downloads_before
                assert set(native.rglob("*.html")) == native_before
                click_second("/large")
                until(lambda: js("return document.querySelector('.cphe-toast')?.textContent.startsWith('Exported HTML:')"), "large native export acknowledged")
                large = set(native.rglob("*.html")) - native_before
                assert len(large) == 1, large
                large_data = large.pop().read_text()
                assert large_data.count("LARGE_CHUNK") == 32768
                assert "INCLUDED_THIRD 日本語" in large_data and "EXCLUDED_FIRST" not in large_data
                assert set(downloads.rglob("*.html")) == downloads_before
                configure_native("", restore=True)
                print(json.dumps({"download": "passed", "nativeMessaging": "passed", "stableInjection": "passed", "optionsSaveReloadRestore": "passed", "nativeFailureNoFallback": "passed", "malformedPayload": "passed", "largeNativeBytes": len(large_data.encode()), "manifestScope": "loopback test XPI only"}))
            except Exception:
                log.seek(0)
                print(log.read()[-12000:])
                raise
            finally:
                if session:
                    try: request("DELETE", session)
                    except Exception: pass
                driver.terminate()
                try: driver.wait(timeout=10)
                except subprocess.TimeoutExpired: driver.kill(); driver.wait()
                server.shutdown()

if __name__ == "__main__":
    main()
