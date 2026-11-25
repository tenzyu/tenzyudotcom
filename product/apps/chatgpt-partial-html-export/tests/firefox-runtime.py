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
        # Only host matches differ in the temporary test XPI.
        local = "http://127.0.0.1/*"
        manifest["permissions"] = [p for p in manifest["permissions"] if not p.startswith("https://")] + [local]
        manifest["content_scripts"][0]["matches"] = [local]
        # Test-only locator, not a mock of the production extension API.
        manifest["content_scripts"][0]["js"].append("fixture-locator.js")
        xpi = root / "fixture.xpi"
        with zipfile.ZipFile(xpi, "w") as z:
            z.writestr("manifest.json", json.dumps(manifest))
            z.writestr("fixture-locator.js", """document.addEventListener('fixture-configure-native', async () => {
              try {
                await browser.storage.local.set({ exportMode: 'native', nativeOutputDir: document.documentElement.dataset.fixtureNativeDir, fallbackToDownload: false });
                document.documentElement.dataset.fixtureConfigured = 'yes';
              } catch (error) { document.documentElement.dataset.fixtureConfigured = String(error); }
            });""")
            for folder in ("src", "options", "popup"):
                for p in (ROOT / folder).rglob("*"):
                    if p.is_file():
                        z.write(p, str(p.relative_to(ROOT)))
        class Fixture(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                body = """<!doctype html><title>Fixture conversation</title>
                <article><div data-message-author-role="user">EXCLUDED_FIRST</div></article>
                <article><div data-message-author-role="assistant"><p>INCLUDED_SECOND</p><button>EXCLUDED_CONTROL</button><script>/* EXCLUDED_SCRIPT */</script></div></article>
                <article><div data-message-author-role="user">INCLUDED_THIRD 日本語</div></article>""".encode()
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
                def click_second():
                    go(origin)
                    until(lambda: js("return document.querySelectorAll('.cphe-export-button').length === 3"), "three injected buttons")
                    js("window.__button=document.querySelectorAll('.cphe-export-button')[1]")
                    time.sleep(.8)
                    assert js("return window.__button===document.querySelectorAll('.cphe-export-button')[1]"), "injection must settle"
                    element = request("POST", session + "/element", {"using":"css selector","value":".cphe-export-button[data-cphe-index='1']"})
                    request("POST", session + "/element/" + element["element-6066-11e4-a52e-4f735466cecf"] + "/click", {})
                def verify(folder):
                    files = until(lambda: [p for p in folder.rglob("*.html") if p.stat().st_size > 0], "exported file")
                    data = files[0].read_text()
                    assert "INCLUDED_SECOND" in data and "INCLUDED_THIRD 日本語" in data
                    assert all(x not in data for x in ("EXCLUDED_FIRST","EXCLUDED_CONTROL","EXCLUDED_SCRIPT"))
                click_second()
                verify(downloads)
                # WebDriver content context cannot navigate moz-extension: pages.
                # Configure via the actual storage API in the temporary addon.
                js("document.documentElement.dataset.fixtureNativeDir=arguments[0];document.dispatchEvent(new Event('fixture-configure-native'))", str(native))
                assert until(lambda: js("return document.documentElement.dataset.fixtureConfigured"), "native storage configured") == "yes"
                click_second()
                verify(native)
                print(json.dumps({"download": "passed", "nativeMessaging": "passed", "stableInjection": "passed", "manifestScope": "loopback test XPI only"}))
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
