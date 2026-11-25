"""Linux WebKitGTK runtime acceptance of the release executable, not Vite."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "src-tauri/target/release/osu-skin-workbench"

def until(fn, label, seconds=30):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        value = fn()
        if value:
            return value
        time.sleep(.1)
    raise AssertionError(label)

def main():
    assert APP.is_file(), f"Expected release executable: {APP}"
    with tempfile.TemporaryDirectory(prefix="skin-workbench-runtime-") as tmp:
        root = Path(tmp)
        home = root / "home"
        home.mkdir()
        data = root / "data"
        data.mkdir()
        skin = root / "skin"
        skin.mkdir()
        content = "[General]\nName: Native runtime fixture\nAuthor: CI\n"
        (skin / "skin.ini").write_text(content)
        env = {**os.environ, "HOME":str(home), "XDG_DATA_HOME":str(data),
               "XDG_CONFIG_HOME":str(root/"config"), "XDG_CACHE_HOME":str(root/"cache")}
        driver_path = str(Path(os.environ["HOME"]) / ".cargo/bin/tauri-driver")
        with open(root / "driver.log", "w+") as log:
            driver = subprocess.Popen([driver_path], env=env, stdout=log, stderr=log)
            endpoint = "http://127.0.0.1:4444"
            session = None
            def request(method, path, body=None):
                payload = json.dumps(body).encode() if body is not None else None
                req = urllib.request.Request(endpoint + path, data=payload, method=method,
                                             headers={"Content-Type":"application/json"})
                with urllib.request.urlopen(req, timeout=60) as response:
                    return json.load(response)["value"]
            def ready():
                if driver.poll() is not None:
                    raise AssertionError("tauri-driver terminated")
                try: return request("GET", "/status").get("ready")
                except OSError: return False
            def start():
                created = request("POST", "/session", {"capabilities":{"alwaysMatch":{
                    "browserName":"wry","tauri:options":{"application":str(APP)}}}})
                print(json.dumps(created["capabilities"]))
                return "/session/" + created["sessionId"]
            def js(code, *args):
                return request("POST", session + "/execute/sync", {"script":code,"args":list(args)})
            def element(selector):
                return request("POST", session + "/element", {"using":"css selector","value":selector})["element-6066-11e4-a52e-4f735466cecf"]
            def click(selector):
                request("POST", session + "/element/" + element(selector) + "/click", {})
            def type_text(selector, value):
                request("POST", session + "/element/" + element(selector) + "/value", {"text":value,"value":list(value)})
            def visible(text):
                return js("return document.body && document.body.innerText.includes(arguments[0])", text)
            try:
                until(ready, "driver ready")
                session = start()
                until(lambda: visible("No projects yet."), "real IPC list completed")
                type_text("#project-name", "Native Runtime CI")
                type_text("#main-skin-path", str(skin))
                until(lambda: js("return [...document.querySelectorAll('button')].some(b=>b.textContent.includes('Import main skin')&&!b.disabled)"), "import enabled")
                import_id = js("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Import main skin'));b.id='runtime-import';return b.id")
                click("#" + import_id)
                until(lambda: visible("Imported project: Native Runtime CI"), "real create IPC acknowledged")
                manifests = list(data.rglob("skin-editor-projects/*/manifest.json"))
                assert len(manifests) == 1, manifests
                manifest = json.loads(manifests[0].read_text())
                assert manifest["name"] == "Native Runtime CI"
                assert (manifests[0].parent/"project/raw/skin.ini").read_text() == content
                assert (skin/"skin.ini").read_text() == content
                refresh_id = js("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Refresh');b.id='runtime-refresh';return b.id")
                click("#" + refresh_id)
                until(lambda: visible("Projects loaded."), "real list IPC after create")
                assert visible("Native Runtime CI")
                print(json.dumps({"launch":"passed","list":"passed","import":"passed","filesystem":"passed","refresh":"passed","scope":"Linux release executable + WebKitGTK; no bundle or other OS claim"}))
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

if __name__ == "__main__":
    main()
