"""Linux WebKitGTK runtime acceptance of the release executable, not Vite."""
import json
import os
from pathlib import Path
import subprocess
import signal
import sys
import tempfile
import time
import urllib.request
import urllib.error

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

def group_has_live_members(group):
    # Linux-only acceptance: zombies cannot write fixture files, and the
    # runner may not be their reaper. Check every live process in our group.
    for entry in Path("/proc").iterdir():
        if not entry.name.isdecimal():
            continue
        try:
            fields = (entry / "stat").read_bytes().rsplit(b")", 1)[1].split()
        except (FileNotFoundError, ProcessLookupError):
            continue
        if int(fields[2]) == group and fields[0] not in (b"Z", b"X"):
            return True
    return False

def stop_driver(driver, grace_seconds=10):
    # start_new_session makes the child PID the private process group ID.
    # Waiting for just tauri-driver leaves WebKitGTK/application descendants.
    def send(sig):
        try:
            os.killpg(driver.pid, sig)
        except ProcessLookupError:
            pass

    def drained():
        driver.poll()  # reap the direct child even if it exited first
        return not group_has_live_members(driver.pid)

    send(signal.SIGTERM)
    forced = False
    try:
        until(drained, "driver process group did not terminate", grace_seconds)
    except AssertionError:
        forced = True
        print("Runtime teardown: escalating owned process group to SIGKILL", flush=True)
        send(signal.SIGKILL)
        until(drained, "driver process group survived SIGKILL", 5)
    driver.wait(timeout=5)
    return forced

def test_teardown():
    # The original parent-only wait succeeds while an orphan is still alive.
    # Reproduce that exact ownership failure without a GUI or a Tauri build.
    with tempfile.TemporaryDirectory(prefix="skin-teardown-test-") as tmp:
        ready = Path(tmp) / "ready"
        child_code = (
            "import pathlib, signal, sys, time;"
            "signal.signal(signal.SIGTERM, signal.SIG_IGN);"
            "pathlib.Path(sys.argv[1]).touch();"
            "time.sleep(60)"
        )
        parent_code = (
            "import subprocess, sys;"
            "subprocess.Popen([sys.executable, '-c', sys.argv[1], sys.argv[2]])"
        )
        driver = subprocess.Popen(
            [sys.executable, "-c", parent_code, child_code, str(ready)],
            start_new_session=True,
        )
        try:
            driver.wait(timeout=5)
            until(ready.exists, "orphan process ready", 5)
            assert group_has_live_members(driver.pid), "fixture must retain a live orphan"
        finally:
            forced = stop_driver(driver, grace_seconds=.2)
        assert forced, "SIGTERM-resistant orphan must trigger bounded escalation"
        assert not group_has_live_members(driver.pid)
        print("Runtime teardown regression: passed", flush=True)

def main(direct=False):
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
        # Match the pinned upstream webdriver.rs native launch contract.
        if direct:
            env.update(TAURI_AUTOMATION="true", TAURI_WEBVIEW_AUTOMATION="true")
        driver_command = ["WebKitWebDriver", "--port=4444", "--host=127.0.0.1"] if direct else [driver_path]
        with open(root / "driver.log", "w+") as log:
            driver = subprocess.Popen(driver_command, env=env, stdout=log, stderr=log,
                                      start_new_session=True)
            endpoint = "http://127.0.0.1:4444"
            session = None
            def request(method, path, body=None, timeout=60):
                payload = json.dumps(body).encode() if body is not None else None
                req = urllib.request.Request(endpoint + path, data=payload, method=method,
                                             headers={"Content-Type":"application/json"})
                try:
                    with urllib.request.urlopen(req, timeout=timeout) as response:
                        return json.load(response)["value"]
                except urllib.error.HTTPError as error:
                    detail = error.read(4096).decode(errors="replace")
                    print(f"WebDriver HTTP {error.code}: {detail}", flush=True)
                    raise
            def ready():
                if driver.poll() is not None:
                    raise AssertionError("tauri-driver terminated")
                try: return request("GET", "/status").get("ready")
                except OSError: return False
            def start():
                launch_options = {"webkitgtk:browserOptions": {"binary":str(APP), "args":[]}} if direct else {"tauri:options":{"application":str(APP)}}
                created = request("POST", "/session", {"capabilities":{"alwaysMatch":{
                    "browserName":"wry", **launch_options}}})
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
                baseline_file = manifests[0].parent / "sources/main/raw/skin.ini"
                project_file = manifests[0].parent / "project/raw/skin.ini"
                assert baseline_file.read_text() == content
                assert (skin/"skin.ini").read_text() == content
                project_file.write_text(content + "# workspace edit\n")
                assert baseline_file.read_text() == content
                assert (skin/"skin.ini").read_text() == content
                project_file.write_text(content)
                refresh_id = js("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Refresh');b.id='runtime-refresh';return b.id")
                click("#" + refresh_id)
                until(lambda: visible("Projects loaded."), "real list IPC after create")
                assert visible("Native Runtime CI")
                # Import another real project, then switch through the workspace's
                # native select. A failed load must not leave the other project's
                # asset matrix attached to the selected project.
                second_skin = root / "second-skin"
                second_skin.mkdir()
                (second_skin / "skin.ini").write_text(content)
                (second_skin / "readme.txt").write_text("second project only")
                type_text("#project-name", "Second Runtime Project")
                type_text("#main-skin-path", str(second_skin))
                until(lambda: js("return [...document.querySelectorAll('button')].some(b=>b.textContent.includes('Import main skin')&&!b.disabled)"), "second import enabled")
                second_import = js("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Import main skin'));b.id='runtime-second-import';return b.id")
                click("#" + second_import)
                until(lambda: visible("Imported project: Second Runtime Project"), "second project created")
                open_id = js("const card=[...document.querySelectorAll('.projectCard')].find(c=>c.innerText.includes('Second Runtime Project'));const b=[...card.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open');b.id='runtime-open';return b.id")
                click("#" + open_id)
                until(lambda: visible("Project files: 2 · Source files: 2"), "second workspace loaded")
                def select_project(project_id):
                    js("const select=document.querySelector('#sidebar-project-select');select.value=arguments[0];select.dispatchEvent(new Event('change',{bubbles:true}));return select.value", project_id)
                select_project(manifest["id"])
                until(lambda: visible("Project files: 1 · Source files: 1"), "first workspace loaded")
                assert visible("Native Runtime CI")
                # Return to the second project, then remove only the isolated
                # fixture's first manifest to force a real get_project_files error.
                second_manifest = next(json.loads(p.read_text()) for p in data.rglob("skin-editor-projects/*/manifest.json") if p != manifests[0])
                select_project(second_manifest["id"])
                until(lambda: visible("Project files: 2 · Source files: 2"), "second workspace reloaded")
                manifests[0].unlink()
                select_project(manifest["id"])
                until(lambda: visible("failed to open manifest"), "selection load failure reported")
                assert visible("Project files: 0 · Source files: 0")
                assert visible("Native Runtime CI")
                print(json.dumps({"launch":"passed","list":"passed","import":"passed","filesystem":"passed","importSnapshotIsolation":"passed","refresh":"passed","selection":"passed","failedSelectionIsolation":"passed","scope":"Linux release executable + WebKitGTK; no bundle or other OS claim"}))
            except Exception:
                log.seek(0)
                print(log.read()[-12000:])
                raise
            finally:
                try:
                    if session:
                        request("DELETE", session, timeout=10)
                finally:
                    stop_driver(driver)

if __name__ == "__main__":
    test_teardown()
    if sys.argv[1:] != ["--test-teardown"]:
        # Diagnostic only: run the identical scenario against both transports
        # on the same runner and release executable. Keep every failure visible.
        import traceback
        results = []
        for round_number in range(3):
            for direct in (False, True):
                mode = "native-direct" if direct else "tauri-intermediary"
                print(f"DRIVER_DIAGNOSTIC_START round={round_number + 1} mode={mode}", flush=True)
                try:
                    main(direct=direct)
                    outcome = {"round":round_number + 1,"mode":mode,"pass":True}
                except Exception as exc:
                    traceback.print_exc()
                    outcome = {"round":round_number + 1,"mode":mode,"pass":False,"errorType":type(exc).__name__,"error":str(exc)}
                results.append(outcome)
                print("DRIVER_DIAGNOSTIC_RESULT " + json.dumps(outcome), flush=True)
        print("DRIVER_DIAGNOSTIC_SUMMARY " + json.dumps(results), flush=True)
        assert all(r["pass"] for r in results), "one or more diagnostic scenarios failed"
